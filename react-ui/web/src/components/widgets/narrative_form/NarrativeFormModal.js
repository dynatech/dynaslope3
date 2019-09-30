import React, { useState, useEffect } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
// import AlertReleaseForm from "./AlertReleaseForm";
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
        closeHandler, pageHandler,
        chosenNarrative
    } = props;

    const [narrative_data, setNarrativeData] = useState({
        narrative_id: null,
        site_list: [],
        timestamp: moment().format("YYYY-MM-DD HH:mm"),
        narrative: "",
        user_id: "",
        event_id: "",
        type_id: 1
    });    

    useEffect(() => {
        let default_narr_data = {};
        if (chosenNarrative !== {}) {
            console.log("chosenNarrative", chosenNarrative);
            console.log("chosenNarrative meron!");
            const {
                id, narrative, timestamp, site_id, user_id, event_id, type_id
            } = chosenNarrative;
            default_narr_data = {
                narrative_id: id, site_list: [site_id],
                timestamp, narrative,
                user_id, event_id, type_id
            };
            setNarrativeData(default_narr_data);
        }
    }, [chosenNarrative]); 

    const handleSubmit = () => {
        const temp = [];
        narrative_data.site_list.forEach(({ value }) => {
            // Value is site_id
            temp.push(value);
        });
        narrative_data.site_list = temp;
        narrative_data.timestamp = moment(narrative_data.timestamp).format("YYYY-MM-DD HH:mm:ss");
        handleNarratives(narrative_data);
        closeHandler();
        handleReset();
        pageHandler(1);
    };

    const handleReset = () => {
        setNarrativeData({
            narrative_id: null,
            site_list: [],
            timestamp: moment().format("YYYY-MM-DD HH:mm"),
            narrative: "",
            user_id: "",
            event_id: "",
            type_id: 1
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
                <DialogTitle id="form-dialog-title">Site Logs Form</DialogTitle>
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
