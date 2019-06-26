import React, { Component, useState } from "react";
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
        reporterIdMt: ""
    });

    const handleNext = () => {
        // const { dataTimestamp, releaseTime, siteId, reporterIdCt, reporterIdMt } = generalData;
        // if (dataTimestamp == null || releaseTime == null || siteId === "" || reporterIdCt === "" || reporterIdMt === "") {
        //     alert("Incomplete info!");
        // } else setActiveStep(prevActiveStep => prevActiveStep + 1);
        setActiveStep(prevActiveStep => prevActiveStep + 1);
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

                    <AlertReleaseForm activeStep={activeStep} generalData={generalData} setGeneralData={setGeneralData} />
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
                                        {activeStep === steps.length - 1 ? "Finish" : "Next"}
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
