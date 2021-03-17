import React, {
    useContext, useEffect, useState,
    Fragment
} from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, makeStyles,
    Stepper, Step, StepLabel, Grid
} from "@material-ui/core";

import moment from "moment";
import { useSnackbar } from "notistack";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

import AlertReleaseForm from "./AlertReleaseForm";
import { getLatestSiteEventDetails, processReleaseInternalAlert } from "./ajax";
import { MonitoringShiftsContext } from "../../contexts/MonitoringShiftsContext";

import { Store } from "./store";
import Actions from "./actions";


const useStyles = makeStyles(() => {
    return {
        stepper: {
            padding: "12px 0 36px"
        }
    };
});

function AlertReleaseFormModal (props) {
    const {
        fullScreen, isOpen, closeHandler,
        chosenCandidateAlert, setChosenCandidateAlert,
        setIsOpenRoutineModal
    } = props;
    const classes = useStyles();

    const { current_ct } = useContext(MonitoringShiftsContext);
    const { enqueueSnackbar } = useSnackbar();

    const { 
        state, dispatch, validateIfNextIsDisabled,
        prepareAlertReleasePayload
    } = useContext(Store);
    useEffect(() => {
        if (isOpen) {
            const payload = moment();
            Actions.updateReleaseTime({ dispatch, payload });

            if (current_ct) {
                Actions.updateCTPersonnel({ dispatch, payload: current_ct.user_id });
            }
        }
    }, [isOpen, dispatch, current_ct]);

    useEffect(() => {
        if (chosenCandidateAlert) {
            setActiveStep(2);
            Actions.useCandidateAlert({ dispatch, payload: chosenCandidateAlert });
        }
    }, [chosenCandidateAlert, dispatch]);

    const [active_step, setActiveStep] = useState(0);
    const steps = [
        "General monitoring alert details",
        "Site alert data and triggers",
        "Alert release preview and comments"
    ];

    const [is_next_btn_disabled, isNextButtonDisabled] = useState(true);
    useEffect(() => {
        const temp = validateIfNextIsDisabled(active_step);
        isNextButtonDisabled(temp);
    }, [state, active_step, validateIfNextIsDisabled]);

    const [is_loading, setIsLoading] = useState(false);
    const handleNext = () => {
        if (active_step === 0) {
            setIsLoading(true);
            getLatestSiteEventDetails(state.site.value, result => {
                Actions.saveLatestSiteEventDetail({ dispatch, payload: result });
                setIsLoading(false);
            });
        } else if (active_step === 1) {
            setIsLoading(true);
            processReleaseInternalAlert(state, result => {
                Actions.savePostComputationDetails({ dispatch, payload: result });
                setIsLoading(false);
            });
        } else {
            const snackbar_key = enqueueSnackbar(
                "Inserting EWI release...",
                {
                    variant: "warning",
                    persist: true
                }
            );

            const payload = prepareAlertReleasePayload(state);
            payload.snackbar_key = snackbar_key;
            console.log(payload);
            sendWSMessage("insert_ewi", payload);
            handleReset();
            return;
        }

        setActiveStep(active_step + 1);
    };
    
    const handleReset = () => {
        Actions.reset({ dispatch });
        setActiveStep(0);
        setChosenCandidateAlert(null);
        setIsLoading(false);
    };

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">Monitoring Alert Release Form</DialogTitle>
            <DialogContent>
                <DialogContentText>                    
                    Fill out the form and read the instructions carefully.
                </DialogContentText>

                <Stepper activeStep={active_step} alternativeLabel className={classes.stepper}>
                    { steps.map(label => (<Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>)) }
                </Stepper>

                <AlertReleaseForm 
                    activeStep={active_step}
                    isLoading={is_loading}
                />
            </DialogContent>
            <DialogActions>
                <Grid item xs style={{ 
                    display: active_step === 0 && 
                    chosenCandidateAlert === null ? "flex" : "none" 
                }}>
                    <Button onClick={setIsOpenRoutineModal} color="secondary">
                        Release Routine Manually
                    </Button>
                </Grid>
                                
                <Grid item xs align="right">
                    {
                        active_step < 3 && <Button 
                            onClick={handleReset}
                            color="primary"
                        >
                            Reset
                        </Button>
                    }
                    <Button 
                        onClick={closeHandler}
                        color="primary"
                    >
                        Close
                    </Button>
                    {
                        active_step < 3 && <Fragment>
                            <Button
                                disabled={active_step === 0} 
                                onClick={() => setActiveStep(active_step - 1)}
                            >
                                Back
                            </Button>

                            <Button
                                color="primary"
                                onClick={handleNext}
                                disabled={is_next_btn_disabled}
                            >
                                {active_step === steps.length - 1 ? "Submit" : "Next"}
                            </Button>
                        </Fragment>
                    }
                </Grid>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(AlertReleaseFormModal);
