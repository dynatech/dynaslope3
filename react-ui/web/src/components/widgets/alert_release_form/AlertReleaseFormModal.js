import React, { Component, useState } from "react";
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

function prepareTriggers (subs, surf, rain, on_demand, earthquake) {
    const trigger_list_arr = [];
    const { switchSubsurface, triggerS2, triggerS3, triggerS0 } = subs;
    if (switchSubsurface) {
        if (triggerS2.status) {
            trigger_list_arr.append({
                internal_sym_id: 3,
                info: triggerS2.techInfo,
                ts: triggerS2.dataTimestamp
            });
        }
        if (triggerS3.status) {
            trigger_list_arr.append({
                internal_sym_id: 1,
                info: triggerS3.techInfo,
                ts: triggerS3.dataTimestamp
            });
        }
        if (triggerS0.status) {
            trigger_list_arr.append({
                internal_sym_id: 2,
                info: triggerS0.techInfo,
                ts: triggerS0.dataTimestamp
            });
        }
    }

    const { switchSurficial, triggerG2, triggerG3, triggerG0 } = surf;
    if (switchSurficial) {
        if (triggerG2.status) {
            trigger_list_arr.append({
                internal_sym_id: 6,
                info: triggerG2.techInfo,
                ts: triggerG2.dataTimestamp
            });
        }
        if (triggerG3.status) {
            trigger_list_arr.append({
                internal_sym_id: 4,
                info: triggerG3.techInfo,
                ts: triggerG3.dataTimestamp
            });
        }
        if (triggerG0.status) {
            trigger_list_arr.append({
                internal_sym_id: 5,
                info: triggerS0.techInfo,
                ts: triggerS0.dataTimestamp
            });
        }
    }

    const { switchRainfall, triggerR1, triggerR0, triggerRx } = rain;
    if (switchRainfall) {
        if (triggerR1.status) {
            trigger_list_arr.append({
                internal_sym_id: 6,
                info: triggerR1.techInfo,
                ts: triggerR1.dataTimestamp
            });
        }
        if (triggerG3.status) {
            trigger_list_arr.append({
                internal_sym_id: 4,
                info: triggerG3.techInfo,
                ts: triggerG3.dataTimestamp
            });
        }
        if (triggerG0.status) {
            trigger_list_arr.append({
                internal_sym_id: 5,
                info: triggerS0.techInfo,
                ts: triggerS0.dataTimestamp
            });
        }
    }
    const { switchOnDemand, reason, reporterId } = on_demand;
    const od_trigger_ts = on_demand.triggerTimestamp;
    const od_trigger_tech_info = on_demand.techInfo;
    const { switchEarthquake, magnitude, latitude, longitude } = earthquake;
    const eq_trigger_ts = earthquake.triggerTimestamp;
    const eq_trigger_tech_info = earthquake.techInfo;


}

function AlertReleaseFormModal (props) {
    const { classes, fullScreen, isOpen, closeHandler } = props;
    const [activeStep, setActiveStep] = useState(0);
    const steps = [1, 2, 3, 4];

    // General Data States
    const [generalData, setGeneralData] = useState({
        dataTimestamp: null,
        releaseTime: null,
        siteId: "",
        reporterIdCt: "",
        reporterIdMt: "",
        comments: ""
    });

    const [subsurfaceTriggerData, setSubsurfaceTriggerData] = useState({
        switchSubsurface: false,
        triggerS2: {
            status: false,
            disabled: false,
            triggerTimestamp: null,
            techInfo: "",
        },
        triggerS3: {
            status: false,
            disabled: false,
            triggerTimestamp: null,
            techInfo: "",
        },
        triggerS0: {
            status: false,
            disabled: false
        }
    });

    const [surficialTriggerData, setSurficialTriggerData] = useState({
        switchSurficial: false,
        triggerG2: {
            status: false,
            disabled: false,
            triggerTimestamp: null,
            techInfo: "",
        },
        triggerG3: {
            status: false,
            disabled: false,
            triggerTimestamp: null,
            techInfo: "",
        },
        triggerG0: {
            status: false,
            disabled: false
        }
    });

    const [rainfallTriggerData, setRainfallTriggerData] = useState({
        switchRainfall: false,
        rainfall: "",
        triggerTimestamp: null,
        techInfo: "",
        triggerR1: {
            disabled: false
        },
        triggerR0: {
            disabled: false
        },
        triggerRx: {
            disabled: false
        }
    });

    const [earthquakeTriggerData, setEarthquakeTriggerData] = useState({
        switchEarthquake: false,
        triggerTimestamp: null,
        techInfo: "",
        magnitude: "",
        latitude: "",
        longitude: ""
    });

    const [onDemandTriggerData, setOnDemandTriggerData] = useState({
        switchOnDemand: false,
        triggerTimestamp: null,
        techInfo: "",
        reason: "",
        reporterId: ""
    });

    const handleSubmit = () => {
        const {
            siteId, dataTimestamp,
            releaseTime, reporterIdMt,
            reporterIdCt
        } = generalData;

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
            trigger_list_arr: [],
            non_triggering_moms: []
        };

        axios.post("http://192.168.150.173:5000/api/monitoring/insert_ewi", payload)
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
    };

    const handleNext = () => {
        // const { dataTimestamp, releaseTime, siteId, reporterIdCt, reporterIdMt } = generalData;
        // if (dataTimestamp == null || releaseTime == null || siteId === "" || reporterIdCt === "" || reporterIdMt === "") {
        //     alert("Incomplete info!");
        // } else setActiveStep(prevActiveStep => prevActiveStep + 1);
        setActiveStep(prevActiveStep => prevActiveStep + 1);
        if (activeStep === steps.length) {
            console.log("Submitting data...");
            handleSubmit();
        }
    };

    function handleBack () {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    }

    function handleReset () {
        setActiveStep(0);
    }

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
                        generalData={generalData} setGeneralData={setGeneralData}
                        subsurfaceTriggerData={subsurfaceTriggerData} setSubsurfaceTriggerData={setSubsurfaceTriggerData}
                        surficialTriggerData={surficialTriggerData} setSurficialTriggerData={setSurficialTriggerData}
                        rainfallTriggerData={rainfallTriggerData} setRainfallTriggerData={setRainfallTriggerData}
                        earthquakeTriggerData={earthquakeTriggerData} setEarthquakeTriggerData={setEarthquakeTriggerData}
                        onDemandTriggerData={onDemandTriggerData} setOnDemandTriggerData={setOnDemandTriggerData}
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
                        {activeStep === steps.length ? (
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
                                    <Button
                                        disabled={activeStep === 0}
                                        onClick={handleBack}
                                        className={classes.backButton}
                                    >
                                            Back
                                        </Button>
                                    <Button variant="contained" color="primary" onClick={handleNext}>
                                        {activeStep === steps.length - 1 ? "Submit" : "Next"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(AlertReleaseFormModal);
