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
import { handleNarratives } from "./ajax";
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

    const [narrative_data, setNarrativeData] = useState({
        site_id: null,
        timestamp: "",
        narrative: "",
        user_id: null,
        event_id: null,
        type_id: 1
    });

    const handleSubmit = () => {
        console.log("SUBMIT!");
        // console.log("PAYLOAD", narrativePayload);
        narrative_data.timestamp = moment(narrative_data.timestamp).format("YYYY-MM-DD HH:mm:ss");
        handleNarratives(narrative_data);
        // console.log("PAYLOAD", ewiPayload);
        // sendWSMessage("insert_ewi", ewiPayload);
    };

    const handleReset = () => {
        console.log("RESET!");
        setNarrativeData({
            site_id: null,
            user_id: null,
            narrative: "",
            event_id: null,
            type_id: 1, // Type for General Monitoring Narratives
            timestamp: ""
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
                        Note: Only monitoring-related narratives can be entered in this form. 
                        Please use other forms dedicated to its purposes.
                    </DialogContentText>

                    <NarrativeForm
                        narrativeData={narrative_data} setNarrativeData={setNarrativeData}
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
