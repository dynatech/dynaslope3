import React, { Fragment, useEffect, useState, useContext } from "react";

import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Button, Grid, makeStyles } from "@material-ui/core";
import { AddAlert, Warning } from "@material-ui/icons";
import { useSnackbar } from "notistack";
import PageTitle from "../../reusables/PageTitle";
import TabBar from "../../reusables/TabBar";
import MonitoringTables from "./MonitoringTables";
import GeneratedAlerts from "./GeneratedAlerts";
import AlertReleaseFormModal from "../../widgets/alert_release_form/AlertReleaseFormModal";
import RoutineReleaseFormModal from "../../widgets/alert_release_form/RoutineReleaseFormModal";
import IssuesAndRemindersList from "../../widgets/issues_and_reminders_form/IssuesAndRemindersList";
import CircularAddButton from "../../reusables/CircularAddButton";
import MonitoringShiftsPanel from "../../widgets/monitoring_shifts/MonitoringShiftsPanel";
import GeneralStyles from "../../../GeneralStyles";
import { 
    subscribeToWebSocket, unsubscribeToWebSocket,
    receiveGeneratedAlerts, receiveCandidateAlerts,
    receiveAlertsFromDB, receiveEWIInsertResponse
} from "../../../websocket/monitoring_ws";
import { getMonitoringShifts, receiveMonitoringShiftData, removeReceiveMonitoringShiftData } from "../../../websocket/misc_ws";
import MomsInsertModal from "../../widgets/moms/MomsInsertModal";
import InsertMomsButton from "../../widgets/moms/InsertMomsButton";
import { GeneralContext } from "../../contexts/GeneralContext";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin
        },
        tabBarContent: {
            marginTop: 30
        }
    };
});

const tabs_array = [
    { label: "Monitoring Tables", href: "monitoring-tables" },
    { label: "Generated Alerts", href: "generated-alerts" }
];

function Container (props) {
    const { width, history } = props;
    const classes = useStyles();

    const [chosenTab, setChosenTab] = useState(0);
    const [generatedAlerts, setGeneratedAlerts] = useState(null);
    const [monitoringShifts, setMonitoringShifts] = useState([]);
    const [candidateAlertsData, setCandidateAlertsData] = useState(null);
    const [alertsFromDbData, setAlertsFromDbData] = useState(null);
    const [isOpenReleaseModal, setIsOpenReleaseModal] = useState(false);
    const [isOpenRoutineModal, setIsOpenRoutineModal] = useState(false);
    const [chosenCandidateAlert, setChosenCandidateAlert] = useState(null);
    const [isOpenIssueReminderModal, setIsOpenIssueReminderModal] = useState(false);
    const [isIandRUpdateNeeded, setIsIandRUpdateNeeded] = useState(false);
    const [is_moms_modal_open, setMomsModal] = useState(false);
    const set_moms_modal_fn = bool => () => setMomsModal(bool);
    const { setIsReconnecting } = useContext(GeneralContext);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    useEffect(() => {
        subscribeToWebSocket(setIsReconnecting);

        receiveGeneratedAlerts(generated_alerts => setGeneratedAlerts(generated_alerts));
        receiveCandidateAlerts(candidate_alerts => setCandidateAlertsData(candidate_alerts));
        receiveAlertsFromDB(alerts_from_db => setAlertsFromDbData(alerts_from_db));
        receiveMonitoringShiftData(shift_data => setMonitoringShifts(shift_data));
        getMonitoringShifts();
        receiveEWIInsertResponse(response => {
            const { snackbar_key, message, status } = response;
            closeSnackbar(snackbar_key);
            enqueueSnackbar(
                message,
                {
                    variant: status ? "success" : "error",
                    autoHideDuration: 7000
                }
            );
        });

        return function cleanup () {
            unsubscribeToWebSocket();
            removeReceiveMonitoringShiftData();
        };
    }, []);

    const handleTabSelected = chosen_tab => {
        setChosenTab(chosen_tab);
    };
    
    const handleBoolean = (data, bool) => () => {
        if (data === "is_open_release_modal") setIsOpenReleaseModal(bool);
        else if (data === "is_open_issues_modal") {
            setIsIandRUpdateNeeded(!bool);
            setIsOpenIssueReminderModal(bool);
        }
        else if (data === "is_routine_modal_open") setIsOpenRoutineModal(bool);
    };

    const releaseAlertHandler = (chosen_candidate, general_status) => () => {
        setChosenCandidateAlert(chosen_candidate);

        if (general_status === "routine") {
            handleBoolean("is_routine_modal_open", true)();
        } else {
            handleBoolean("is_open_release_modal", true)();
        }
    };

    const routineReleaseHandler = chosen_candidate => () => {
        setChosenCandidateAlert(chosen_candidate);
        handleBoolean("is_open_release_modal", false)();
        handleBoolean("is_routine_modal_open", true)();
    };

    const is_desktop = isWidthUp("md", width);

    const custom_buttons = <span>
        <Button
            aria-label="Add issue/reminder"
            variant="contained"
            color="primary"
            size="small"
            style={{ marginRight: 8 }}
            onClick={handleBoolean("is_open_issues_modal", true)}
            startIcon={<Warning />}
        >
            Add issue/reminder
        </Button>
        <span style={{ marginRight: 8 }}>
            <InsertMomsButton clickHandler={set_moms_modal_fn(true)} />
        </span>
        <Button
            aria-label="Release alert"
            variant="contained"
            color="primary"
            size="small"
            onClick={releaseAlertHandler(null)}
            startIcon={<AddAlert />}
        >
            Release Alert
        </Button>
    </span>;

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Alert Monitoring | Dashboard"
                    customButtons={is_desktop ? custom_buttons : false}
                />
            </div>

            <div className={classes.tabBar}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <IssuesAndRemindersList 
                            isOpenIssueReminderModal={isOpenIssueReminderModal}
                            setIsOpenIssueReminderModal={setIsOpenIssueReminderModal}
                            isIandRUpdateNeeded={isIandRUpdateNeeded}
                            setIsIandRUpdateNeeded={setIsIandRUpdateNeeded}
                        />
                    </Grid>
                    
                    <Grid item md={9}>
                        <div style={{ marginBottom: 12 }}>
                            <MonitoringShiftsPanel shiftData={monitoringShifts}/>
                        </div>

                        <TabBar
                            chosenTab={chosenTab}
                            onSelect={handleTabSelected}
                            tabsArray={tabs_array}
                        />
                        <div className={classes.tabBarContent}>         
                            {chosenTab === 0 && (
                                <MonitoringTables
                                    width={width}
                                    candidateAlertsData={candidateAlertsData}
                                    alertsFromDbData={alertsFromDbData}
                                    releaseFormOpenHandler={releaseAlertHandler}
                                    history={history}
                                />
                            )}
                            {chosenTab === 1 && <GeneratedAlerts generatedAlertsData={generatedAlerts} />}
                        </div>
                    </Grid>
                </Grid>
            </div>

            { !is_desktop && <CircularAddButton clickHandler={handleBoolean("is_open_release_modal", true)} /> }

            <AlertReleaseFormModal
                isOpen={isOpenReleaseModal}
                closeHandler={handleBoolean("is_open_release_modal", false)}
                setChosenCandidateAlert={setChosenCandidateAlert}
                chosenCandidateAlert={chosenCandidateAlert}
                alertsFromDbData={alertsFromDbData}
                setIsOpenRoutineModal={routineReleaseHandler(null)}
            />

            <RoutineReleaseFormModal
                isOpen={isOpenRoutineModal}
                closeHandler={handleBoolean("is_routine_modal_open", false)}
                chosenCandidateAlert={chosenCandidateAlert}
                setChosenCandidateAlert={setChosenCandidateAlert}
            />

            <MomsInsertModal
                isOpen={is_moms_modal_open}
                closeHandler={set_moms_modal_fn(false)}
            />
        </Fragment>
    );


}
export default withWidth()(Container);
