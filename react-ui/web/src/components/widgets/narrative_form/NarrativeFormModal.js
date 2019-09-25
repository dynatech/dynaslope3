import React, { useState, useEffect } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog,
    Typography
} from "@material-ui/core";
import { compose } from "recompose";
// import AlertReleaseForm from "./AlertReleaseForm";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import NarrativeForm from "./NarrativeForm";

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


function NarrativeFormModal (props) {
    const {
        classes, fullScreen, isOpen,
        closeHandler
    } = props;

    const [narrativeData, setNarrativeData] = useState({
        siteId: 1,
        narrative: "",
        userId: ""
    });

    const handleSubmit = () => {
        console.log("SUBMIT!");
        // console.log("PAYLOAD", ewiPayload);
        // sendWSMessage("insert_ewi", ewiPayload);
    };

    const handleReset = () => {
        console.log("RESET!");
        setNarrativeData({
            siteId: 1,
            narrative: "",
            userId: ""            
        });
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"

            >
                <DialogTitle id="form-dialog-title">Narrative Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Provide accurate details for the narrative.
                    </DialogContentText>

                    <NarrativeForm
                        narrativeData={narrativeData} setNarrativeData={setNarrativeData}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <Button onClick={closeHandler} color="primary">
                                            Cancel
                        </Button>
                        <Button onClick={handleReset}>Reset</Button>
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={false}>
                            Submit
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(NarrativeFormModal);
