import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import moment from "moment";

import { insertIssuesAndRemindersViaPost } from "./ajax";
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
        chosenIssueReminder, isIandRUpdateNeeded, toResolve,
        setToRefresh, toRefresh
    } = props;
    const [issue_reminder_data, setIssueReminderData] = useState({});
    
    useEffect(() => {
        if (isIandRUpdateNeeded) {
            const chosenData = chosenIssueReminder;
            const get_site_id_list = chosenIssueReminder.postings.map(row => row.site_id);
            const event_ids = [];
            chosenIssueReminder.postings.forEach(row => {
                const { event: event_id } = row;
                if (event_id !== null) event_ids.push(event_id);
            });
            chosenData.site_id_list = get_site_id_list;
            chosenData.is_event_entry = event_ids.length > 0;
            setIssueReminderData(chosenData);
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
        const ts_now = moment().format("YYYY-MM-DD HH:mm:ss");
        let temp = {
            ...issue_reminder_data,
            ts_posted: ts_now
        };

        if (resolution !== "" && resolution !== null) {
            const resolver_user_id = getCurrentUser().user_id;
            temp = {
                ...issue_reminder_data,
                ts_resolved: ts_now,
                resolved_by: resolver_user_id
            };   
        }

        insertIssuesAndRemindersViaPost(temp, data => {
            if (data && typeof toRefresh !== "undefined") {
                setToRefresh(!toRefresh);
            }
        });
        closeHandlerAction();  
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
