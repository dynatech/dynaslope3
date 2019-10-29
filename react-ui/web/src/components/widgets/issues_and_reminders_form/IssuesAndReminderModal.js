import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import moment from "moment";

import { handleIssuesAndReminders } from "./ajax";
import IssuesAndReminderForm from "./IssuesAndRemindersForm";


function IssuesAndReminderModal (props) {
    const {
        fullScreen, isOpen,
        setIsOpenIssueReminderModal, setIsUpdateNeeded,
        chosenIssueReminder, isUpdateNeeded, toResolve
    } = props;

    const default_state = {
        detail: "",
        iar_id: "",
        site_id_list: null,
        user_id: 1,
        postings: "",
        resolution: "",
        resolved_by: 1,
        ts_resolved: "",
        ts_posted: moment().format("YYYY-MM-DD HH:mm:ss"),
        ts_expiration: "",
        is_event_entry: false,
        is_persistent: false
    };

    const [issue_reminder_data, setIssueReminderData] = useState(default_state);
    
    const handleReset = () => setIssueReminderData(default_state);
    const closeHandler = () => setIsOpenIssueReminderModal(false);

    useEffect(() => {
        setIssueReminderData(chosenIssueReminder);
        // if (!(Object.entries(chosenIssueReminder).length === 0 && chosenIssueReminder.constructor === Object)) {
        //     setIssueReminderData(chosenIssueReminder);
        // } else {
        //     handleReset();
        // }
    }, [chosenIssueReminder]); 

    const handleSubmit = () => {
        const { resolution } = issue_reminder_data;
        if (resolution !== "" && resolution !== null) {
            setIssueReminderData({
                ...issue_reminder_data,
                ts_resolved: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        }
        handleIssuesAndReminders(issue_reminder_data, ret => {
            // closeHandler();
            // handleReset();
            // setIsUpdateNeeded(!isUpdateNeeded);
        });
        closeHandler();
        handleReset();
        setIsUpdateNeeded(!isUpdateNeeded);        
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"

        >
            <DialogTitle id="form-dialog-title">Issues and Reminder Form</DialogTitle>
            <DialogContent>
                <DialogContentText>
                        Provide information to the following fields.
                </DialogContentText>

                <IssuesAndReminderForm
                    issueReminderData={issue_reminder_data}
                    setIssueReminderData={setIssueReminderData}
                    fullScreen={fullScreen}
                    toResolve={toResolve}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeHandler} color="primary">
                        Cancel
                </Button>
                <Button color="secondary" onClick={handleSubmit} disabled={false}>
                        Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(IssuesAndReminderModal);
