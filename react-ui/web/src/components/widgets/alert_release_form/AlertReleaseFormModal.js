import React, { Component, useState, useEffect, useReducer } from "react";
import axios from "axios";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import AlertReleaseForm from "./AlertReleaseForm";
import Stepper from "./Stepper";

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


function prepareTriggers(triggers) {
    const trigger_list = [];
    Object.keys(triggers).forEach((key) => {
        console.log(key, triggers[key]);
        if (triggers[key].switchState) trigger_list.push(...triggers[key].triggers);
    });
    return trigger_list;
}

function AlertReleaseFormModal(props) {
    const { classes, fullScreen, isOpen, closeHandler } = props;
    const [activeStep, setActiveStep] = useState(0);
    const [isNextBtnDisabled, setIsNextBtnDisabled] = useState(true);
    const steps = [1, 2, 3, 4];

    // General Data States
    const [generalData, setGeneralData] = useState({
        dataTimestamp: null,
        releaseTime: null,
        siteId: "",
        reporterIdCt: 1,
        reporterIdMt: 2,
        comments: "",
        publicAlert: ""
    });

    const [triggers, setTriggers] = useReducer((triggs, { action, trigger_type, value }) => {
        const trigger = triggs[trigger_type];
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
    }, {
            subsurface: { switchState: false, triggers: [] },
            surficial: { switchState: false, triggers: [] },
            rainfall: { switchState: false, triggers: [] },
            earthquake: { switchState: false, triggers: [] },
            on_demand: { switchState: false, triggers: [] }
        });

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

    const handleSubmit = () => {
        const {
            siteId, dataTimestamp,
            releaseTime, reporterIdMt,
            reporterIdCt
        } = generalData;

        const trigger_list = prepareTriggers(triggers);
        console.log("trigger_list", trigger_list);

        const payload = {
            site_id: siteId,
            routine_sites_ids: [],
            alert_level: null,
            release_details: {
                data_ts: moment(dataTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                trigger_list: "m",
                release_time: moment(releaseTime).format("HH:mm")
            },
            publisher_details: {
                publisher_mt_id: reporterIdMt,
                publisher_ct_id: reporterIdCt
            },
            trigger_list_arr: "triggers_list",
            non_triggering_moms: []
        };

        console.log("PAYLOAD", payload);

        // axios.post("http://127.0.0.1:5000/api/monitoring/insert_ewi", payload)
        // .then((response) => {
        //     console.log(response);
        // })
        // .catch((error) => {
        //     console.log(error);
        // });
    };

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
        if (activeStep === steps.length - 1) {
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
                    <DialogContentText>
                        Provide accurate details to manually release an alert.
                    </DialogContentText>

                    <AlertReleaseForm
                        activeStep={activeStep}
                        triggersState={triggers} setTriggersState={setTriggers}
                        generalData={generalData} setGeneralData={setGeneralData}
                    />
                </DialogContent>
                <DialogActions>
                    {/* <Button onClick={closeHandler} color="primary">
                            Cancel
                    </Button>
                    <Button onClick={closeHandler} color="primary">
                            Submit
                    </Button> */}
                    <div>
                        {
                            activeStep === steps.length ? (
                                <div>
                                    <Typography className={classes.instructions}>All steps completed</Typography>
                                    <Button onClick={handleReset}>Reset</Button>
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
