import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Typography,
    Button, makeStyles, withMobileDialog, Grid
} from "@material-ui/core";
import AlertReleaseForm from "./AlertReleaseForm";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { createReleaseDetails, getMonitoringReleaseByDataTS } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";
import { CTContext } from "../../monitoring/dashboard/CTContext";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        marginTop: 8,
        marginBottom: 8
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    }
}));

function prepareTriggers (triggers) {
    const trigger_list = [];

    Object.keys(triggers).forEach((key) => {
        if (triggers[key].switchState) {
            const temp = triggers[key].triggers;
            const trigger_type = key === "on_demand" ? "on demand" : key;
            
            temp.forEach(trigger => {
                const {
                    timestamp, alert_level,
                    internal_sym_id, tech_info
                } = trigger;


                let ts_updated = null;
                if (timestamp !== null) 
                    ts_updated = timestamp.format("YYYY-MM-DD HH:mm:00");

                let final_alert_level = alert_level;
                if (alert_level === "nd") final_alert_level = -1;
                else if (alert_level === "rx") final_alert_level = -2;

                let addendum;
                switch (key) {
                    case "moms":
                        addendum = {
                            moms_id_list: trigger.moms_id_list
                        };
                        break;
                    case "on_demand":
                        // eslint-disable-next-line no-case-declarations
                        const od_details = {
                            request_ts: ts_updated,
                            narrative: trigger.reason,
                            reporter_id: trigger.reporterId
                        };
                        addendum = {
                            od_details
                        };
                        break;
                    case "earthquake":
                        // eslint-disable-next-line no-case-declarations
                        const { magnitude, latitude, longitude } = trigger;
                        // eslint-disable-next-line no-case-declarations
                        const eq_details = {
                            magnitude: parseFloat(magnitude), 
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude)
                        };
                        addendum = {
                            eq_details
                        };
                        break;
                    default:
                        addendum = {};
                        break;
                }

                const formatted = {
                    ...addendum,
                    alert_level: final_alert_level,
                    internal_sym_id,
                    tech_info,
                    trigger_type,
                    ts_updated
                };

                trigger_list.push(formatted);
            });
        }
    });
    return trigger_list;
}

const initial_triggers_data = {
    subsurface: { switchState: false, triggers: [] },
    surficial: { switchState: false, triggers: [] },
    moms: { switchState: false, triggers: [] },
    rainfall: { switchState: false, triggers: [] },
    earthquake: { switchState: false, triggers: [] },
    on_demand: { switchState: false, triggers: [] }
};

function alertTriggersReducer (triggs, { action, trigger_type, value }) {
    let trigger = {};
    let triggers_array = [];
    if (action !== "RESET_STATE") {
        const t = triggs[trigger_type];
        trigger = { ...t };
        const { triggers: arr } = trigger;
        triggers_array = arr;
    }

    switch (action) {
        case "TOGGLE_SWITCH":
            return {
                ...triggs,
                [trigger_type]: {
                    ...trigger,
                    switchState: value
                }
            };
        case "ADD_TRIGGER":
            return {
                ...triggs,
                [trigger_type]: {
                    ...trigger,
                    triggers: [...triggers_array, value]
                }
            };
        case "REMOVE_TRIGGER":
            let temp;
            if (value === "clear_all") {
                temp = [];
            } else {
                temp = triggers_array.filter(trig => trig.alert_level !== value.alert_level);
            }

            return {
                ...triggs,
                [trigger_type]: {
                    ...trigger,
                    triggers: temp
                }
            };
        case "UPDATE_DETAILS":
            // eslint-disable-next-line no-case-declarations
            const temp2 = triggers_array.map(trig => {
                if (trig.alert_level === value.alert_level) return { ...trig, ...value };
                return trig;
            });
            return {
                ...triggs,
                [trigger_type]: {
                    ...trigger,
                    triggers: temp2
                }
            };
        case "RESET_STATE":
            return { ...initial_triggers_data };
        default: return triggs;
    }
}

function AlertReleaseFormModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenCandidateAlert,
        setChosenCandidateAlert, setIsOpenRoutineModal
    } = props;
    const classes = useStyles();
    const { user_id: reporter_id_mt } = getCurrentUser();

    const [ewiPayload, setEwiPayload] = useState({});
    const [activeStep, setActiveStep] = useState(0);
    const [isNextBtnDisabled, setIsNextBtnDisabled] = useState(true);
    const steps = [1, 2, 3];
    const [internalAlertLevel, setInternalAlertLevel] = useState("");
    const [publicAlertLevel, setPublicAlertLevel] = useState("");
    const [modal_title, setModalTitle] = useState("");

    const { reporter_id_ct } = React.useContext(CTContext);
    
    const initial_general_data = {
        dataTimestamp: null,
        releaseTime: moment(),
        siteId: {},
        siteCode: "", 
        address: "",
        reporterIdCt: reporter_id_ct,
        reporterIdMt: reporter_id_mt,
        comments: "",
        publicAlertSymbol: "",
        publicAlertLevel: ""
    };
    const [generalData, setGeneralData] = useState({ ...initial_general_data });

    const [hasNoGroundData, setHasNoGroundData] = useState(false);
    const [isUpdatingRelease, setIsUpdatingRelease] = useState(false);

    const [triggers, setTriggers] = useReducer(alertTriggersReducer, { ...initial_triggers_data });
    // const [currentTriggerList, setCurrentTriggerList] = useReducer(alertTriggersReducer, { ...initial_triggers_data });
    const [db_saved_triggers, setDBSavedTriggers] = useState([]);

    const [current_triggers_status, setCurrentTriggersStatus] = useState([]);

    useEffect(() => {
        const { dataTimestamp: input_data_ts, siteCode } = generalData;

        if (typeof input_data_ts === "object" && input_data_ts !== null) {
            const temp_ts = moment(input_data_ts).format("YYYY-MM-DD HH:mm:ss");

            getMonitoringReleaseByDataTS(siteCode, temp_ts, latest_release => {
                if (Object.entries(latest_release).length > 1) {
                    setIsUpdatingRelease(true);
                }
            });
        }
    }, [generalData.dataTimestamp]);

    useEffect(() => {
        if (chosenCandidateAlert !== null && chosenCandidateAlert.general_status !== "routine") {
            const {
                site_id, site_code, public_alert_level,
                public_alert_symbol, release_details, trigger_list_arr,
                has_ground_data, non_triggering_moms, internal_alert_level,
                current_triggers_status: cts, saved_event_triggers,
                to_extend_validity
            } = chosenCandidateAlert;
            const { data_ts, trigger_list_str } = release_details;

            setInternalAlertLevel(internal_alert_level);

            const valid_triggers = [];
            trigger_list_arr.forEach(row => {
                if (row.invalid !== true) {
                    valid_triggers.push(row);
                }

                if (row.trigger_type === "moms") {
                    const { moms_list } = row;
                    row.moms_id_list = moms_list.map(x => x.moms_id);
                }
            });

            let final_non_trig_moms = null;
            if (non_triggering_moms.length > 0) {
                const moms_id_list = non_triggering_moms.map(row => row.moms_id);
                final_non_trig_moms = {
                    moms_id_list
                };
            }

            setEwiPayload({
                ...ewiPayload,
                site_id,
                site_code,
                public_alert_level,
                public_alert_symbol,
                release_details: {
                    data_ts,
                    trigger_list_str,
                    release_time: moment().format("HH:mm:00")
                },
                publisher_details: {
                    publisher_mt_id: reporter_id_mt,
                    publisher_ct_id: reporter_id_ct
                },
                trigger_list_arr: valid_triggers,
                non_triggering_moms: final_non_trig_moms,
                to_extend_validity
            });

            const no_ground_data = !has_ground_data;
            setHasNoGroundData(no_ground_data);

            const temp = {
                ...generalData,
                reporterIdCt: reporter_id_ct,
                dataTimestamp: moment(data_ts),
                siteId: { value: site_id, label: site_code.toUpperCase() },
                siteCode: site_code,
                triggerListStr: trigger_list_str,
                publicAlertSymbol: public_alert_symbol,
                publicAlertLevel: public_alert_level,
                nonTriggeringMoms: non_triggering_moms
            };
            setGeneralData({ ...temp });

            setTriggers({ action: "RESET_STATE" });
            if (typeof saved_event_triggers !== "undefined")
                setDBSavedTriggers(saved_event_triggers);
            // setCurrentTriggerList({ action: "RESET_STATE" });

            const invalid_list = [];
            // INCLUDE TRIGGERS THAT ARE GIVEN FROM ALERTGEN
            trigger_list_arr.forEach(element => {
                const { 
                    trigger_type, alert_level, ts_updated, 
                    internal_sym_id, tech_info, alert, invalid
                } = element;

                if (typeof invalid === "undefined") {
                    let obj = { action: "TOGGLE_SWITCH", trigger_type, value: true };
                    setTriggers(obj);
                    // setCurrentTriggerList(obj);

                    const value = {
                        alert,
                        alert_level,
                        internal_sym_id,
                        tech_info,
                        disabled: false,
                        status: true,
                        timestamp: moment(ts_updated)
                    };

                    if (trigger_type === "moms") {
                        const { moms_list } = element;
                        value.moms_list = moms_list;
                        value.moms_id_list = moms_list.map(row => row.moms_id);
                    }
                
                    obj = { action: "ADD_TRIGGER", trigger_type, value };
                    setTriggers(obj);
                    // setCurrentTriggerList(obj);

                    if (trigger_type in ["on demand", "earthquake"]) {
                        let addendum = null;
                        switch (trigger_type) {
                            case "on demand":
                                addendum = {
                                    action: "UPDATE_TRIGGER",
                                    trigger_type,
                                    value: {
                                        od_details: {
                                            request_ts: "",
                                            narrative: ""
                                        }
                                    }
                                };
                                break;
                            case "earthquake":
                                addendum = {
                                    action: "UPDATE_TRIGGER",
                                    trigger_type,
                                    value: {
                                        eq_details: {
                                            magnitude: "",
                                            latitude: "",
                                            longitude: ""
                                        }
                                    }
                                };
                                break;
                            default:
                                break;
                        }

                        if (addendum != null) {
                            setTriggers(addendum);
                        }
                    }
                } else {
                    invalid_list.push(trigger_type);
                }
            });

            // Set in candidate alerts, programmed to contain only rxs and nds
            setCurrentTriggersStatus(cts);
            cts.forEach(row => {
                const { trigger_source: trigger_type, alert_level } = row;

                // Do not toggle NDs and Rxs if trigger is invalid
                if (invalid_list.includes(trigger_type)) return; 

                let f_alert_level = alert_level;
                // rainfall is excluded because of radio input (diff value as keys)
                if (alert_level === -1 && trigger_type !== "rainfall") {
                    f_alert_level = "nd";
                }

                let obj = { action: "TOGGLE_SWITCH", trigger_type, value: true };
                setTriggers(obj);
                // setCurrentTriggerList(obj);

                const value = {
                    status: true,
                    disabled: false,
                    alert_level: f_alert_level,
                    timestamp: null,
                    tech_info: ""
                };

                obj = { action: "ADD_TRIGGER", trigger_type, value };
                setTriggers(obj);
                // setCurrentTriggerList(obj);
            });

            setActiveStep(2);
        } else {
            setGeneralData({ ...initial_general_data });
            setTriggers({ action: "RESET_STATE" });
            // setCurrentTriggerList({ action: "RESET_STATE" });
            setDBSavedTriggers([]);
            setCurrentTriggersStatus([]);
            setInternalAlertLevel("");
            setActiveStep(0);
        }
    }, [chosenCandidateAlert, reporter_id_ct]);

    // THIS USEEFFECT CHECKS WHETHER NEXT BUTTON SHOULD BE ENABLED
    // CHECK IF INPUT HAS ENTRIES
    const [is_recomputing, setIsRecomputing] = useState(false);

    useEffect(() => {
        setIsNextBtnDisabled(true);

        if (activeStep === 0) {
            const {
                siteId, dataTimestamp, releaseTime,
                reporterIdCt, reporterIdMt
            } = generalData;

            if (siteId !== "" && dataTimestamp !== null && releaseTime !== null && reporterIdCt !== "" && reporterIdMt !== "") {
                setIsNextBtnDisabled(false);
            } else {
                setIsNextBtnDisabled(true);
            }
        } else if (activeStep === 1) {
            const trigger_keys_array = Object.keys(triggers);
            let is_disabled = false;
            for (let i = 0; i < trigger_keys_array.length; i += 1) {
                const { switchState, triggers: trigger_list } = triggers[trigger_keys_array[i]];
                if (switchState) {
                    const { length } = trigger_list;

                    if (length === 0) is_disabled = true;
                    else {
                        for (let j = 0; j < length; j += 1) {
                            if ([1, 2, 3].includes(trigger_list[j].alert_level)) {
                                if (trigger_keys_array[i] === "on_demand") {
                                    const { reason, reporterId, tech_info, timestamp } = trigger_list[j];
                                    if (
                                        tech_info === "" || timestamp === "" ||
                                        reason === "" || reporterId === ""
                                    ) is_disabled = true;
                                } else if (trigger_keys_array[i] === "earthquake") {
                                    const {
                                        tech_info, timestamp, magnitude,
                                        longitude, latitude
                                    } = trigger_list[j];
                                    if (
                                        tech_info === "" || timestamp === "" ||
                                        magnitude === "" || longitude === "" ||
                                        latitude === ""
                                    ) is_disabled = true;

                                } else {
                                    const { tech_info, timestamp } = trigger_list[j];
                                    if (tech_info === "" || timestamp === null) is_disabled = true;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            setIsNextBtnDisabled(is_disabled);
        } else if (activeStep === 2) {
            const bool = reporter_id_ct === "";
            setIsNextBtnDisabled(bool || is_recomputing);
        }
    }, [generalData, triggers, activeStep, reporter_id_ct, is_recomputing]);

    useEffect(() => {
        const { subsurface, surficial } = triggers;
        if (subsurface.switchState || surficial.switchState)
            setHasNoGroundData(false);
    }, [triggers.subsurface, triggers.surficial]);

    const handleSubmit = () => {
        console.log("Submitting data...", ewiPayload);
        sendWSMessage("insert_ewi", ewiPayload);
    };

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);

        const {
            siteId, siteCode, publicAlertSymbol,
            dataTimestamp, releaseTime, reporterIdMt,
            reporterIdCt, comments, triggerListStr
        } = generalData;
        let latest_trigger_list = [];
        let current_trigger_list = [];
        let temp = {};

        if (activeStep === 0) {
            setEwiPayload({
                ...ewiPayload,
                site_id: siteId.value,
                site_code: siteCode,
                public_alert_level: publicAlertLevel,
                public_alert_symbol: publicAlertSymbol,
                release_details: {
                    data_ts: moment(dataTimestamp).format("YYYY-MM-DD HH:mm:00"),
                    trigger_list_str: triggerListStr,
                    release_time: moment(releaseTime).format("HH:mm:00")
                },
                publisher_details: {
                    publisher_mt_id: reporterIdMt,
                    publisher_ct_id: reporterIdCt
                },
                non_triggering_moms: [] // should set non_triggering_moms on next
            });
        } else if (activeStep === 1) {
            latest_trigger_list = prepareTriggers(triggers);
            // current_trigger_list = prepareTriggers(currentTriggerList);
            current_trigger_list = db_saved_triggers;

            // PREPARE THE INTERNAL ALERT from BACKEND
            const json_data = { latest_trigger_list, current_trigger_list };
            console.log("JSON data for alert generation recomputation", json_data);

            if (latest_trigger_list.length > 0) {
                setIsRecomputing(true);

                const final_arr = latest_trigger_list.filter(row => row.alert_level > 0);
                
                createReleaseDetails(json_data, ret => {
                    const {
                        internal_alert_level, public_alert_level,
                        trigger_list_str, public_alert_symbol
                    } = ret;
                    setPublicAlertLevel(public_alert_level);
                    setInternalAlertLevel(internal_alert_level);
                    setEwiPayload({
                        ...ewiPayload,
                        public_alert_level,
                        public_alert_symbol,
                        internal_alert_level,
                        release_details: {
                            ...ewiPayload.release_details,
                            trigger_list_str
                        },
                        trigger_list_arr: final_arr
                    });

                    setIsRecomputing(false);
                });
            } else {
                setEwiPayload({
                    ...ewiPayload,
                    trigger_list_arr: []
                });
            }
        } else if (activeStep === (steps.length - 1)) {
            setModalTitle("");
            temp = ewiPayload;
            temp.release_details.comments = comments;
            setEwiPayload(temp);
            handleSubmit();
        }
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const handleClose = () => {
        closeHandler();
        setActiveStep(0);
        setChosenCandidateAlert(null);
        setGeneralData({ ...initial_general_data });
        setEwiPayload({});
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Alert Release Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>                    
                        {modal_title}
                    </DialogContentText>
                    <AlertReleaseForm
                        activeStep={activeStep}
                        isUpdatingRelease={isUpdatingRelease}
                        triggersState={triggers} setTriggersState={setTriggers}
                        generalData={generalData} setGeneralData={setGeneralData}
                        internalAlertLevel={internalAlertLevel} setInternalAlertLevel={setInternalAlertLevel}
                        // setTriggerList={setCurrentTriggerList}
                        setPublicAlertLevel={setPublicAlertLevel}
                        setModalTitle={setModalTitle} ewiPayload={ewiPayload}
                        hasNoGroundData={hasNoGroundData} setHasNoGroundData={setHasNoGroundData}
                        currentTriggersStatus={current_triggers_status}
                        dBSavedTriggers={db_saved_triggers}
                    />
                </DialogContent>
                <DialogActions>
                    {
                        activeStep === steps.length ? (
                            <div>
                                {/* <Typography className={classes.instructions}>All steps completed</Typography> */}
                                {/* <Button onClick={handleReset}>Reset</Button> */}
                                <Button onClick={handleClose} color="primary">
                                        Okay
                                </Button>
                            </div>
                        ) : (
                            <Grid container spacing={1} justify="space-between">
                                <Grid item xs style={{ display: chosenCandidateAlert === null ? "flex" : "none" }}>
                                    <Button onClick={setIsOpenRoutineModal} className={classes.backButton}>
                                            Release Routine
                                    </Button>
                                </Grid>
                                <Grid item xs align="right">
                                    <Button onClick={handleClose} color="primary">
                                            Cancel
                                    </Button>
                                    <Button disabled={activeStep === 0} onClick={handleBack} className={classes.backButton}>
                                            Back
                                    </Button>
                                    <Button variant="contained" color="primary" onClick={handleNext} disabled={isNextBtnDisabled}>
                                        {activeStep === steps.length - 1 ? "Submit" : "Next"}
                                    </Button>
                                </Grid>
                            </Grid>
                        )
                    }
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(AlertReleaseFormModal);
