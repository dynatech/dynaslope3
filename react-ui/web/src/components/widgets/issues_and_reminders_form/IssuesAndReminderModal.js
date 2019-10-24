import React, { useState, useEffect } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
// import AlertReleaseForm from "./AlertReleaseForm";
import { handleIssuesAndReminders } from "./ajax";
import IssuesAndReminderForm from "./IssuesAndRemindersForm";

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


function IssuesAndReminderModal (props) {
    const {
        classes, fullScreen, isOpen,
        closeHandler, setIsUpdateNeeded,
        chosenIssueReminder, isUpdateNeeded
    } = props;

    const default_state = {
        detail: "",
        iar_id: "",
        site_id_list: null,
        user_id: 1,
        postings: "",
        resolution: "",
        resolved_by: 1,
        ts_posted: moment().format("YYYY-MM-DD HH:mm:ss"),
        ts_posted_until: moment().format("YYYY-MM-DD HH:mm:ss"),
        is_event_entry: false,
        is_persistent: false
    };

    const [issue_reminder_data, setIssueReminderData] = useState({});

    useEffect(() => {
        setIssueReminderData(default_state);

        if (!(Object.entries(chosenIssueReminder).length === 0 && chosenIssueReminder.constructor === Object)) {
            setIssueReminderData(chosenIssueReminder);
        } else {
            handleReset();
        }
    }, [chosenIssueReminder]); 

    const handleSubmit = () => {
        handleIssuesAndReminders(issue_reminder_data, ret => {
            // closeHandler();
            // handleReset();
            // setIsUpdateNeeded(!isUpdateNeeded);
        });
        closeHandler();
        handleReset();
        setIsUpdateNeeded(!isUpdateNeeded);        
    };

    const handleReset = () => {
        setIssueReminderData(default_state);
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"

            >
                <DialogTitle id="form-dialog-title">Issues and Reminder Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ISSUES AND REMINDERS. For project-wide reminder, leave the sites field blank. For persistent reminders with no
                        expiration, tick &quot;Is persistent?&quot;.  
                    </DialogContentText>

                    <IssuesAndReminderForm
                        issueReminderData={issue_reminder_data} setIssueReminderData={setIssueReminderData}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <Button onClick={closeHandler} color="primary">
                                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={false}>
                            Submit
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(IssuesAndReminderModal);
