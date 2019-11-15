import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog,
    Typography
} from "@material-ui/core";
import { compose } from "recompose";
import AlertReleaseForm from "./AlertReleaseForm";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { buildInternalAlertLevel } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";

const styles = theme => ({
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
});


function prepareTriggers (triggers) {
    const trigger_list = [];
    Object.keys(triggers).forEach((key) => {
        console.log(key, triggers[key]);
        if (triggers[key].switchState) {
            const temp = triggers[key].triggers;
            temp.forEach(trigger => {
                const {
                    timestamp, alert_level, internal_sym_id,
                    tech_info
                } = trigger;
                const formatted = {
                    alert_level,
                    internal_sym_id,
                    tech_info,
                    trigger_type: key,
                    ts_updated: timestamp.format("YYYY-MM-DD HH:mm:ss")
                };
                trigger_list.push(formatted);
            });
            console.log(key, temp);
            // trigger_list.push();
        }
    });
    return trigger_list;
}

function alertTriggersReducer (triggs, { action, trigger_type, value }) {
    const trigger = triggs[trigger_type];
    console.log("triggs", triggs);
    const { triggers: triggers_array } = trigger;

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
        default: return triggs;
    }
}

function AlertReleaseFormModal (props) {
    const {
        classes, fullScreen, isOpen,
        closeHandler, chosenCandidateAlert
    } = props;

    const mt_personnel = getCurrentUser();

    const [ewiPayload, setEwiPayload] = useState({});
    const [activeStep, setActiveStep] = useState(0);
    const [isNextBtnDisabled, setIsNextBtnDisabled] = useState(true);
    const steps = [1, 2, 3, 4];
    const [internalAlertLevel, setInternalAlertLevel] = useState("");
    const [publicAlertLevel, setPublicAlertLevel] = useState("");
    const [currentTriggerList, setCurrentTriggerList] = useState("");
    const [modal_title, setModalTitle] = useState("Provide accurate details to manually release an alert.");
    
    const [generalData, setGeneralData] = useState({
        dataTimestamp: null,
        releaseTime: moment(),
        siteId: "",
        siteCode: "",
        reporterIdCt: "",
        reporterIdMt: mt_personnel.user_id,
        comments: "",
        publicAlertSymbol: "",
        publicAlertLevel: ""
    });

    const [MTFullName, setMTFullName] = useState("");
    const [CTFullName, setCTFullName] = useState("");
    const [hasNoGroundData, setHasNoGroundData] = useState(false);

    const [triggers, setTriggers] = useReducer(alertTriggersReducer, {
        subsurface: { switchState: false, triggers: [] },
        surficial: { switchState: false, triggers: [] },
        moms: { switchState: false, triggers: [] },
        rainfall: { switchState: false, triggers: [] },
        earthquake: { switchState: false, triggers: [] },
        on_demand: { switchState: false, triggers: [] }
    });

    useEffect(() => {
        if (chosenCandidateAlert != null) {
            const {
                site_id, site_code, public_alert_level,
                public_alert_symbol, release_details, trigger_list_arr,
                ground_alert_level
            } = chosenCandidateAlert;

            const { data_ts, trigger_list_str } = release_details;

            setInternalAlertLevel(`A${public_alert_level}-${trigger_list_str}`);

            const no_ground_data = ground_alert_level === -1;
            setHasNoGroundData(no_ground_data);

            const initial_general_data = {
                dataTimestamp: moment(data_ts),
                releaseTime: moment(),
                siteId: site_id,
                siteCode: site_code,
                reporterIdCt: "",
                reporterIdMt: "",
                comments: "",
                triggerListStr: trigger_list_str,
                publicAlertSymbol: public_alert_symbol,
                publicAlertLevel: public_alert_level
            };
            setGeneralData(initial_general_data);

            // INCLUDE TRIGGERS THAT ARE GIVEN FROM ALERTGEN
            trigger_list_arr.forEach(element => {
                console.log("candidate trigger", element);
                const { trigger_type, alert_level, ts_updated, internal_sym_id, tech_info } = element;

                setTriggers({ action: "TOGGLE_SWITCH", trigger_type, value: true });

                setTriggers({
                    action: "ADD_TRIGGER",
                    trigger_type,
                    value: {
                        alert_level,
                        internal_sym_id,
                        tech_info,
                        disabled: false,
                        status: true,
                        timestamp: moment(ts_updated)
                    }
                });

                if (trigger_type in ["on demand", "moms", "earthquake"]) {
                    console.log("TRIGGER TYPE", trigger_type);
                    switch (trigger_type) {
                        case "on demand":
                            setTriggers({
                                action: "UPDATE_TRIGGER",
                                trigger_type,
                                value: {
                                    od_details: {
                                        request_ts: "",
                                        narrative: ""
                                    }
                                }
                            });
                            break;
                        case "earthquake":
                            setTriggers({
                                action: "UPDATE_TRIGGER",
                                trigger_type,
                                value: {
                                    eq_details: {
                                        magnitude: "",
                                        latitude: "",
                                        longitude: ""
                                    }
                                }
                            });
                            break;
                        case "moms":
                            console.log("WALA PANG MOMS STEP");
                            break;
                        default:
                            break;
                    }

                }
            });
        }
    }, [chosenCandidateAlert]);

    useEffect(() => {
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
                                // is_disabled = true;
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
        }
    }, [generalData, triggers]);

    useEffect(() => {
        console.log("CHANGE IN GROUND SHET");
        const { subsurface, surficial } = triggers;
        if (subsurface.switchState || surficial.switchState) setHasNoGroundData(false);
    }, [triggers.subsurface, triggers.surficial]);

    const handleSubmit = () => {
        console.log("PAYLOAD", ewiPayload);
        // sendWSMessage("insert_ewi", ewiPayload);
    };

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);

        const {
            siteId, siteCode, publicAlertSymbol,
            dataTimestamp, releaseTime, reporterIdMt,
            reporterIdCt, comments, triggerListStr
        } = generalData;
        let latest_trigger_list = {};
        let temp = {};

        if (activeStep === 0) {
            console.log(generalData);
            setEwiPayload({
                ...ewiPayload,
                site_id: siteId,
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
                non_triggering_moms: []
            });
        } else if (activeStep === 1) {
            latest_trigger_list = prepareTriggers(triggers);

            // PREPARE THE INTERNAL ALERT from BACKEND
            const json_data = { latest_trigger_list, current_trigger_list: currentTriggerList };
            if (latest_trigger_list.length > 0) {
                buildInternalAlertLevel(json_data, ret => {
                    const { internal_alert_level, public_alert_level, trigger_list_str } = ret;
                    setPublicAlertLevel(public_alert_level);
                    setInternalAlertLevel(internal_alert_level);
    
                    setEwiPayload({
                        ...ewiPayload,
                        public_alert_level,
                        public_alert_symbol: `A${public_alert_level}`,
                        internal_alert_level,
                        release_details: {
                            ...ewiPayload.release_details,
                            trigger_list_str
                        },
                        trigger_list_arr: latest_trigger_list
                    });                
                });
            }
            console.log("latest_trigger_list", latest_trigger_list);
        } else if (activeStep === 2) {
            temp = ewiPayload;
            temp.release_details.comments = comments;
            setEwiPayload(temp);
            console.log("ewiPayload", ewiPayload);
        } else if (activeStep === (steps.length - 1)) {
            console.log("Submitting data...");
            handleSubmit();
        }
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
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
                    {modal_title}
                    <AlertReleaseForm
                        activeStep={activeStep}
                        triggersState={triggers} setTriggersState={setTriggers}
                        generalData={generalData} setGeneralData={setGeneralData}
                        internalAlertLevel={internalAlertLevel} setInternalAlertLevel={setInternalAlertLevel}
                        setTriggerList={setCurrentTriggerList} setPublicAlertLevel={setPublicAlertLevel}
                        setModalTitle={setModalTitle} setMTFullName={setMTFullName} setCTFullName={setCTFullName}
                        MTFullName={MTFullName} CTFullName={CTFullName}
                        hasNoGroundData={hasNoGroundData} setHasNoGroundData={setHasNoGroundData}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        {
                            activeStep === steps.length ? (
                                <div>
                                    <Typography className={classes.instructions}>All steps completed</Typography>
                                    <Button onClick={handleReset}>Reset</Button>
                                    <Button onClick={closeHandler} color="primary">
                                        Okay
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <Button onClick={closeHandler} color="primary">
                                                Cancel
                                        </Button>
                                        <Button disabled={activeStep === 0} onClick={handleBack} className={classes.backButton}>
                                                Back
                                        </Button>
                                        <Button variant="contained" color="primary" onClick={handleNext} disabled={isNextBtnDisabled}>
                                            {activeStep === steps.length - 1 ? "Submit" : "Next"}
                                        </Button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(AlertReleaseFormModal);
