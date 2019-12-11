import React, { useState, Fragment, useEffect } from "react";
import { useSnackbar } from "notistack";
import moment from "moment";
import { IconButton, Grid, Button } from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import MessageInputTextbox from "./MessageInputTextbox";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import QuickSelectModal from "./QuickSelectModal";
import { getEWISMSRecipients, writeEwiNarrativeToDB, getEwiSMSNarrative } from "../ajax";
import { sendMessageToDB } from "../../../websocket/communications_ws";
import { getCurrentUser } from "../../sessions/auth";


function SendMessageForm (props) {
    const {
        isMobile, textboxValue, disableQuickSelect,
        releaseId, siteCode, modalStateHandler
    } = props;

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const current_user = getCurrentUser();

    const [recipients, setRecipients] = useState([]);
    const [options, setOptions] = useState([]);
    const [quick_select, setQuickSelect] = useState(false);
    const [composed_message, setComposedMessage] = useState(textboxValue);
    const [str_recipients, setStrRecipients] = useState("");

    const currentUser = getCurrentUser();

    const disable_select = typeof disableQuickSelect === "undefined" ? false : disableQuickSelect;

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        getEWISMSRecipients(siteCode, ewi_recipients_list => {
            const temp_ewi_recipients = [];
            const default_recipients = [];
            const org_recipients = [];
            let tmp_str_recipients = "";

            ewi_recipients_list.forEach(item => {
                if (item.mobile_numbers.length > 0) {
                    const { user_id, last_name, first_name, organizations, ewi_recipient } = item;
                    const org_name = organizations[0].organization.name.toUpperCase();

                    if (!org_recipients.includes(org_name)) {
                        org_recipients.push(org_name);
                        tmp_str_recipients = `${tmp_str_recipients}, ${org_name}`;
                    }
                    
                    const temp = {
                        label: `${last_name}, ${first_name} (${org_name})`,
                        value: user_id,
                        data: item
                    };
                    temp_ewi_recipients.push(temp);
                    if (ewi_recipient === 1) default_recipients.push(temp);
                }
            });
            setOptions(temp_ewi_recipients);
            setRecipients(default_recipients);
            
            setStrRecipients(str_recipients);
        });
    }, []);


    const handle_message_fn = event => setComposedMessage(event.target.value);

    const on_send_message_fn = () => {
        const recipient_list = [];
        recipients.forEach(({ data: { mobile_numbers } }) => {
            mobile_numbers.forEach(item => recipient_list.push({
                mobile_id: item.mobile_number.mobile_id,
                gsm_id: item.mobile_number.gsm_id
            }));
        });

        const payload = {
            sms_msg: composed_message,
            recipient_list
        };

        sendMessageToDB(payload, response => {
            getEwiSMSNarrative(releaseId, ewi_sms_response => {
                const { narrative, site_list, event_id, type_id } = ewi_sms_response;
                const f_narrative = `${narrative} ${setRecipients}`;
                const temp_nar = {
                    type_id,
                    site_list,
                    event_id,
                    narrative: f_narrative,
                    user_id: current_user.user_id,
                    timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
                };

                writeEwiNarrativeToDB (temp_nar, narrative_ret => {
                    // closeHandler();
                    modalStateHandler();
                    if (response === "Success") {
                        enqueueSnackbar(
                            "EWI SMS Sent!",
                            {
                                variant: "success",
                                autoHideDuration: 7000,
                                action: snackBarActionFn
                            }
                        );
                    } else {
                        enqueueSnackbar(
                            "Error sending EWI SMS...",
                            {
                                variant: "error",
                                autoHideDuration: 7000,
                                action: snackBarActionFn
                            }
                        );
                    }
                    console.log("CLOSE THE MODAL AND SHOW SNACKBAR");
                });
            });

        });
    };

    return (
        <Fragment>
            <Grid container justify="space-around" alignItems="flex-end">
                <Grid item xs>
                    <SelectMultipleWithSuggest
                        label="Recipients"
                        options={options}
                        value={recipients}
                        changeHandler={value => setRecipients(value)}
                        placeholder="Select recipients"
                        renderDropdownIndicator
                        openMenuOnClick
                        isMulti
                    />
                </Grid>

                {
                    !disable_select && (
                        <Grid item style={{ textAlign: "right" }}>
                            <IconButton
                                aria-label="Quick select option"
                                onClick={value => setQuickSelect(true)}
                            >
                                <AddBox />
                            </IconButton>
                        </Grid>
                    )
                }
            </Grid>
            
            <QuickSelectModal value={quick_select} closeHandler={value => setQuickSelect(false)} />

            {
                !isMobile && <div style={{ height: 80 }} />
            }
                
            <div style={{ marginTop: 16 }}>
                <MessageInputTextbox
                    limitRows={false}
                    value={composed_message}
                    sendButtonClickHandler={on_send_message_fn}
                    messageChangeHandler={handle_message_fn}
                />
            </div>
                
        </Fragment>
    );
}

export default SendMessageForm;
