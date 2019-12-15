import React, { useState, Fragment, useEffect } from "react";
import { useSnackbar } from "notistack";
import moment from "moment";
import { IconButton, Grid, Button, CircularProgress } from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import MessageInputTextbox from "./MessageInputTextbox";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import QuickSelectModal from "./QuickSelectModal";
import { 
    getEWISMSRecipients, writeEwiNarrativeToDB,
    getEwiSMSNarrative, sendMessage
} from "../ajax";
import { getCurrentUser } from "../../sessions/auth";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { insertTagsAfterEWISms } from "../../widgets/ajax";

function recipientsFormatterForNarrative (recipients) {
    const orgs = new Map();

    recipients.forEach(row => {
        const { data: { organizations } } = row;

        if (organizations.length > 0) {
            const org = organizations[0];
            const { organization: { name, scope } } = org;

            let pre = "";
            if (name === "lgu") {
                switch (scope) {
                    case 1:
                        pre = "B"; break;
                    case 2:
                        pre = "M"; break;
                    case 3:
                        pre = "P"; break;
                    default:
                        break;
                }
            }

            orgs.set(pre + name.toUpperCase());
        }
    });

    return Array.from(orgs.keys()).join(", ");
}

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
                const org_recipients = [];

                ewi_recipients_list.forEach(item => {
                    if (item.mobile_numbers.length > 0) {
                        const { user_id, last_name, first_name, organizations, ewi_recipient } = item;
                        const org_name = organizations[0].organization.name.toUpperCase();

                        if (!org_recipients.includes(org_name)) {
                            org_recipients.push(org_name);
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

        // TODO: ETO YUNG PANGKUHA NG RECIPIENTS PAG SA EWI SMS MODAL
        // GAWA NG SARILI PAG GALING SA COMPOSE
        if (from_ewi_modal) {
            recipients.forEach(({ data: { mobile_numbers } }) => {
                mobile_numbers.forEach(item => recipient_list.push({
                    mobile_id: item.mobile_number.mobile_id,
                    gsm_id: item.mobile_number.gsm_id
                }));
            });
        } else {
            console.log(recipients);
        }

        const formatted_message = `${composed_message} - ${current_user.first_name} from PHIVOLCS-DYNASLOPE`;

        const payload = {
            sms_msg: formatted_message,
            recipient_list
        };

        sendMessage(payload, response => {
            if (from_ewi_modal && response.status) {
                getEwiSMSNarrative(releaseId, ewi_sms_response => {
                    const { narrative, site_list, event_id, type_id } = ewi_sms_response;
                    const str = recipientsFormatterForNarrative(recipients);
                    const f_narrative = `${narrative} ${str}`;
                    const temp_nar = {
                        type_id,
                        site_list,
                        event_id,
                        narrative: f_narrative,
                        user_id: current_user.user_id,
                        timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
                    };

                    writeEwiNarrativeToDB (temp_nar, () => {});
                });

                const payload = {
                    user_id: getCurrentUser().user_id,
                    outbox_id: response.outbox_id,
                    ts: moment().format("YYYY-MM-DD HH:mm:ss")
                };

                insertTagsAfterEWISms(payload);
            }

            modalStateHandler();
            if (response.status) {
                const { site_id, type } = updateSentStatusObj;
                sendWSMessage("update_db_alert_ewi_sent_status", {
                    alert_db_group: type,
                    site_id,
                    ewi_group: "sms"
                });

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
                    response.message,
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
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
