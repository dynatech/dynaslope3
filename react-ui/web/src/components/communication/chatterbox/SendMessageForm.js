import React, { useState, Fragment, useEffect } from "react";
import { useSnackbar } from "notistack";
import { IconButton, Grid, Button, CircularProgress } from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import MessageInputTextbox from "./MessageInputTextbox";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import QuickSelectModal from "./QuickSelectModal";
import { getEWISMSRecipients, sendMessage } from "../ajax";
import { getCurrentUser } from "../../sessions/auth";

function SendMessageForm (props) {
    const {
        isMobile, textboxValue, disableQuickSelect,
        releaseId, siteCode, // if siteCode is given, it came from EWISmsModal
        fromEWIModal,
        modalStateHandler,
        updateSentStatusObj, // updateSentStatusObj used only in EWISmsModal
        recipientsList
    } = props;
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const current_user = getCurrentUser();

    const [recipients, setRecipients] = useState([]);
    const [options, setOptions] = useState([]);
    const [quick_select, setQuickSelect] = useState(false);
    const [composed_message, setComposedMessage] = useState(textboxValue);

    const disable_select = typeof disableQuickSelect === "undefined" ? false : disableQuickSelect;
    const from_ewi_modal = typeof fromEWIModal === "undefined" ? false : fromEWIModal;

    const [is_loading_recipients, setIsLoadingRecipients] = useState(false);

    useEffect(() => {
        if (typeof siteCode !== "undefined") {
            setIsLoadingRecipients(true);
            getEWISMSRecipients(siteCode, ewi_recipients_list => {
                const temp_ewi_recipients = [];
                const default_recipients = [];

                const { type, public_alert_symbol: { alert_level } } = updateSentStatusObj;

                ewi_recipients_list.forEach(item => {
                    if (item.mobile_numbers.length > 0) {
                        const {
                            user_id, last_name, first_name,
                            organizations, ewi_recipient, ewi_restriction
                        } = item;
                        const { name, scope } = organizations[0].organization;
                        let org_name = name.toUpperCase();
                        
                        if (name === "lgu") {
                            let prefix;
                            if (scope === 1) prefix = "B";
                            if (scope === 2) prefix = "M";
                            if (scope === 3) prefix = "P";
                            org_name = prefix + org_name;
                        }
                    
                        const temp = {
                            label: `${last_name}, ${first_name} (${org_name})`,
                            value: user_id,
                            data: item
                        };

                        temp_ewi_recipients.push(temp);
                        if (ewi_recipient === 1) {
                            let to_push = true;
                            if (type === "extended") { 
                                // LEWC to MLGU
                                to_push = false;
                                if (name === "lewc" || (scope < 3 && name === "lgu")) to_push = true; 
                            } else if (ewi_restriction !== null && alert_level !== 0 && alert_level < ewi_restriction.alert_level) {
                                to_push = false;
                            }
                            
                            if (to_push) default_recipients.push(temp);
                        }
                    }
                });
                setOptions(temp_ewi_recipients);
                setRecipients(default_recipients);
                setIsLoadingRecipients(false);
            });
        }
    }, [siteCode]);

    useEffect(() => {
        if (typeof recipientsList !== "undefined") {
            setIsLoadingRecipients(true);
            
            const temp = recipientsList.map(row => {
                const { label, mobile_id, org, sim_num } = row;
                let fin_label = label;
                if (org !== "") fin_label = `${label} (${org})`;
                fin_label += ` - ${sim_num}`;

                const chip_label = `${label} - ${sim_num}`;

                return {
                    label: fin_label,
                    chipLabel: chip_label,
                    value: mobile_id,
                    sim_num,
                    data: row
                };
            });

            setOptions(temp);
            setRecipients([]);
            setIsLoadingRecipients(false);
        }
    }, [recipientsList]);

    const handle_message_fn = event => setComposedMessage(event.target.value);

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const on_send_message_fn = () => {
        const recipient_list = [];

        if (from_ewi_modal) {
            recipients.forEach(row => {
                const { data } = row;
                const { mobile_numbers } = data;

                mobile_numbers.forEach(item => recipient_list.push({
                    mobile_id: item.mobile_number.mobile_id,
                    gsm_id: item.mobile_number.gsm_id,
                    data
                }));
            });
        } else {
            recipients.forEach(({ data: { mobile_id, gsm_id } }) => {
                recipient_list.push({
                    mobile_id, gsm_id
                });
            });
        }

        const formatted_message = `${composed_message} - ${current_user.nickname} from PHIVOLCS-DYNASLOPE`;

        let payload = {
            sms_msg: formatted_message,
            recipient_list,
            is_ewi: from_ewi_modal
        };

        if (from_ewi_modal) {
            const { site_id, type } = updateSentStatusObj;

            payload = {
                ...payload,
                release_id: releaseId,
                user_id: current_user.user_id,
                site_id,
                alert_db_group: type
            };
        }

        const loading_snackbar = enqueueSnackbar(
            "Sending EWI message...",
            {
                variant: "warning",
                persist: true
            }
        );

        modalStateHandler();

        sendMessage(payload, response => {
            closeSnackbar(loading_snackbar);
            const { message, status } = response;
            let temp = message;
            let variant;

            if (status) {
                variant = "success";
                temp = "EWI SMS sent!";
            } else variant = "error";
            
            enqueueSnackbar(
                temp,
                {
                    variant,
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        }, () => {
            enqueueSnackbar(
                "Error sending EWI SMS...",
                {
                    variant: "error",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const is_recipients_empty = recipients === null || recipients.length === 0;
    const is_message_empty = composed_message === "" || typeof composed_message === "undefined";

    return (
        <Fragment>
            <Grid container justify="space-around" alignItems="flex-end">
                {
                    is_loading_recipients && (
                        <Grid item xs={1}>
                            <CircularProgress size={20} />
                        </Grid>
                    )
                }

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
            
            <QuickSelectModal
                isOpen={quick_select}
                closeHandler={value => setQuickSelect(false)}
                setRecipients={setRecipients}
            />

            {
                !isMobile && <div style={{ height: 80 }} />
            }
                
            <div style={{ marginTop: 16 }}>
                <MessageInputTextbox
                    limitRows={false}
                    value={composed_message}
                    disableSend={is_recipients_empty || is_message_empty}
                    sendButtonClickHandler={on_send_message_fn}
                    messageChangeHandler={handle_message_fn}
                    setComposedMessage={setComposedMessage}
                    disableTemplateLoader={from_ewi_modal}
                />
            </div>
                
        </Fragment>
    );
}

export default SendMessageForm;
