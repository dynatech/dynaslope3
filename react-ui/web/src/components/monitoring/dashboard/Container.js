import React, { Fragment, useEffect, useState } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { withStyles } from "@material-ui/core/styles";
import { compose } from "recompose";
import { Button, Grid } from "@material-ui/core";
import { AddAlert } from "@material-ui/icons";

import PageTitle from "../../reusables/PageTitle";
import TabBar from "../../reusables/TabBar";
import MonitoringTables from "./MonitoringTables";
import GeneratedAlerts from "./GeneratedAlerts";
import AlertReleaseFormModal from "../../widgets/alert_release_form/AlertReleaseFormModal";
import IssuesAndRemindersList from "../../widgets/issues_and_reminders_form/IssuesAndRemindersList";
import CircularAddButton from "../../reusables/CircularAddButton";
import GeneralStyles from "../../../GeneralStyles";
import { 
    subscribeToWebSocket, unsubscribeToWebSocket,
    receiveGeneratedAlerts, receiveCandidateAlerts, receiveAlertsFromDB
} from "../../../websocket/monitoring_ws";

const styles = theme => {
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
};

const tabs_array = [
    { label: "Monitoring Tables", href: "monitoring-tables" },
    { label: "Generated Alerts", href: "generated-alerts" }
];

function Container (props) {
    const { classes, width } = props;
    const [chosenTab, setChosenTab] = useState(0);
    const [generatedAlerts, setGeneratedAlerts] = useState([]);
    const [candidateAlertsData, setCandidateAlertsData] = useState([]);
    const [alertsFromDbData, setAlertsFromDbData] = useState({ latest: [], extended: [], overdue: [] });
    const [isOpenReleaseModal, setIsOpenReleaseModal] = useState(false);
    const [chosenCandidateAlert, setChosenCandidateAlert] = useState(null);

    const [isOpenIssueReminderModal, setIsOpenIssueReminderModal] = useState(false);
    const [isUpdateNeeded, setIsUpdateNeeded] = useState(false);
    
    useEffect(() => {
        subscribeToWebSocket("socket_fns");

        receiveGeneratedAlerts(generated_alerts => {
            const temp = JSON.parse(generated_alerts);
            // console.log("generated_alerts from wss", temp);
            setGeneratedAlerts(temp);
        });
        receiveCandidateAlerts(candidate_alerts => {
            const temp = JSON.parse(candidate_alerts);
            // console.log("candidate_alerts from wss", temp);
            setCandidateAlertsData(temp);
        });
        receiveAlertsFromDB(alerts_from_db => {
            const temp = JSON.parse(alerts_from_db);
            // console.log("alerts_from_db from wss", temp);
            setAlertsFromDbData(temp);
        });

        return function cleanup () {
            unsubscribeToWebSocket();
        };
    }, []);

    const handleTabSelected = chosen_tab => {
        setChosenTab(chosen_tab);
    };

    const handleBoolean = (data, bool) => () => {
        if (data === "is_open_release_modal") setIsOpenReleaseModal(bool);
        else if (data === "is_open_issues_modal") {
            setIsUpdateNeeded(!bool);
            setIsOpenIssueReminderModal(bool);
        }
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
        >
            <AddAlert style={{ paddingRight: 4, fontSize: 20 }} />
            Add issue/reminder
        </Button>
        <Button
            aria-label="Release alert"
            variant="contained"
            color="primary"
            size="small"
            onClick={handleBoolean("is_open_release_modal", true)}
        >
            <AddAlert style={{ paddingRight: 4, fontSize: 20 }} />
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
                            isUpdateNeeded={isUpdateNeeded}
                            setIsUpdateNeeded={setIsUpdateNeeded}
                        />
                    </Grid>
                    
                    <Grid item md={9}>
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
                                    releaseFormOpenHandler={handleBoolean("is_open_release_modal", true)}
                                    chosenCandidateHandler={setChosenCandidateAlert}
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
                chosenCandidateAlert={chosenCandidateAlert}
                alertsFromDbData={alertsFromDbData}
            />
        </Fragment>
    );


}

export default compose(withWidth(), withStyles(styles))(Container);
