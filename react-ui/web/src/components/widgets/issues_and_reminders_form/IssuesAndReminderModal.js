import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import moment from "moment";

import { handleIssuesAndReminders } from "./ajax";
import IssuesAndReminderForm from "./IssuesAndRemindersForm";

// Session Stuff
import { getCurrentUser } from "../../sessions/auth";

const default_state = {
    detail: "",
    iar_id: "",
    site_id_list: null,
    user_id: "",
    postings: "",
    resolution: null,
    resolved_by: null,
    ts_resolved: null,
    ts_posted: moment().format("YYYY-MM-DD HH:mm:ss"),
    ts_expiration: null,
    is_event_entry: false,
    is_persistent: false
};

function IssuesAndReminderModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, setIsIandRUpdateNeeded,
        chosenIssueReminder, isIandRUpdateNeeded, toResolve
    } = props;
    const [issue_reminder_data, setIssueReminderData] = useState({});
    
    useEffect(() => {
        if (isIandRUpdateNeeded) {
            const chosenData = chosenIssueReminder;
            const get_site_id_list = chosenIssueReminder.postings.map(row => row.site_id);
            const get_event_id = chosenIssueReminder.postings.map(row => row.event.event_id);
            chosenData.site_id_list = get_site_id_list;
            chosenData.is_event_entry = get_event_id.length > 0;
            setIssueReminderData(chosenData);
            console.log(chosenData);
        } else {
            setIssueReminderData(default_state);
        }
    }, [isOpen, chosenIssueReminder]);

    const closeHandlerAction = () => {
        setIsIandRUpdateNeeded(false);
        closeHandler(false);
    };

    const handleSubmit = () => {
        const { resolution } = issue_reminder_data;

        if (resolution !== "") {
            const resolver_user_id = getCurrentUser().user_id;
            setIssueReminderData({
                ...issue_reminder_data,
                ts_resolved: moment().format("YYYY-MM-DD HH:mm:ss"),
                resolved_by: resolver_user_id
            });
            handleIssuesAndReminders(issue_reminder_data, ret => {});
            closeHandlerAction();     
        }
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
                <Button onClick={closeHandlerAction} color="primary">
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
