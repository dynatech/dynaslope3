import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions,
    Button, withMobileDialog, Divider,
    Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";
import moment from "moment";

import { useSnackbar } from "notistack";
import BulletinTemplate from "./BulletinTemplate";
import { downloadBulletin, getBulletinEmailDetails, write_bulletin_narrative } from "./ajax";
import { sendBulletinEmail } from "../../communication/mailbox/ajax";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

const default_data = {
    mail_content: "",
    recipients: [],
    next_bulletin_sched_notice: "",
    sent_status: false
};

function formatRecipientsToString (mail_recipients) {
    let str_recipients = "";
    const len_recipients = mail_recipients.length;
    let index = 0;
    mail_recipients.forEach((recipient) => {
        console.log("%d: %s", index, recipient);
        let tmp_rcp = "";
        switch (recipient) {
            case "rusolidum@phivolcs.dost.gov.ph":
                tmp_rcp = "RUS";
                break;
            case "asdaag48@gmail.com":
                tmp_rcp = "ASD";
                break;
            default:
                tmp_rcp = recipient;
                break;
        }
        str_recipients += tmp_rcp;

        if (len_recipients !== (index + 1)) str_recipients += ", ";
        index += 1;
    });

    return str_recipients;
}


function BulletinModal (props) {
    const {
        classes, fullScreen, isOpenBulletinModal,
        setIsOpenBulletinModal,
        releaseDetail
    } = props;
    const {
        release_id, site_code, site_id,
        type // either "latest", "extended", "overdue"
    } = releaseDetail;

    // const [bulletin_modal_data, setBulletinModalData] = useState({});
    const [mail_subject, setMailSubject] = useState("");
    const [mail_recipients, setMailRecipients] = useState([]);
    const [mail_content, setMailContent] = useState("");
    const [file_name, setFileName] = useState("");
    const [sent_status, setSentStatus] = useState(false);
    const [narrative_details, setNarrativeDetails] = useState({});
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        if (typeof release_id !== "undefined" && isOpenBulletinModal) {
            getBulletinEmailDetails(release_id, ret => {
                const {
                    subject, recipients, mail_body,
                    file_name: filename,
                    narrative_details: tmp_nar
                } = ret;

                setNarrativeDetails(tmp_nar);
                setMailRecipients(recipients);
                setMailSubject(subject);
                setMailContent(mail_body);
                setFileName(filename);
            });
        }
    }, [isOpenBulletinModal]);

    const downloadHandler = release_id_input => () => {
        downloadBulletin(release_id_input, ret => {
            console.log("LOG bulletin_download", ret);
        });
    };

    const closeHandler = () => {
        setIsOpenBulletinModal(false);
        setNarrativeDetails({});
        setMailRecipients([]);
        setMailSubject("");
        setMailContent("");
        setFileName("");
    };

    const handleSend = () => {
        const input = {
            subject: mail_subject,
            recipients: mail_recipients,
            mail_body: mail_content,
            release_id,
            file_name 
        };
        const loading_snackbar = enqueueSnackbar(
            "Sending EWI bulletin...",
            {
                variant: "warning",
                persist: true
            }
        );
        closeHandler();
        sendBulletinEmail(input, ret => {
            console.log("sent bulletin email...", ret);
            const { status, message } = ret;
            closeSnackbar(loading_snackbar);
            if (status) {
                enqueueSnackbar(
                    message,
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );

                sendWSMessage("update_db_alert_ewi_sent_status", {
                    alert_db_group: type,
                    site_id,
                    ewi_group: "bulletin"
                });

                if (typeof narrative_details === "object") {
                    const formatted_recip = formatRecipientsToString(mail_recipients);
                    const temp_nar = {
                        ...narrative_details,
                        narrative: `${narrative_details.narrative} ${formatted_recip}`,
                        timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
                    };
                    write_bulletin_narrative(temp_nar, narrative_ret => {
                        console.log("NARRATIVE WRITTEN!");
                    });
                } else console.log("NO NARRATIVE WRITTEN: TEST ONLY");
            } else {
                enqueueSnackbar(
                    message,
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        }, () => {
            closeSnackbar(loading_snackbar);
            enqueueSnackbar(
                "Send bulletin failed. Ask the devs.",
                {
                    variant: "error",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const mailContentHandler = event => {
        setMailContent(event.target.value);
    };

    const handleAddChip = chip => {
        const temp = mail_recipients;
        temp.push(chip);
        setMailRecipients([...temp]);
    };

    const handleDeleteChip = (chip, index) => {
        mail_recipients.splice(mail_recipients.indexOf(chip), 1);
        setMailRecipients([...mail_recipients]);
    };

    let f_site_code = "";
    if (typeof site_code !== "undefined") {
        f_site_code = site_code.toUpperCase();
    }

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpenBulletinModal}
            aria-labelledby="form-dialog-title"
            maxWidth="md"
        >
            <DialogTitle id="form-dialog-title">Early Warning Bulletin for {f_site_code}</DialogTitle>
            <DialogContent>
                {/* <DialogContentText>
                        Provide information to the following fields.
                </DialogContentText> */}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            required
                            label="Mail Content"
                            value={mail_content}
                            onChange={mailContentHandler}
                            placeholder="Add mail content"
                            multiline
                            rowsMax={6}
                            fullWidth
                            className={classes.textField}
                        />                        
                    </Grid>

                    <Grid item xs={12}>
                        <ChipInput 
                            label="To"
                            value={mail_recipients}
                            onAdd={chip => handleAddChip(chip)}
                            onDelete={(chip, index) => handleDeleteChip(chip, index)}
                            fullWidth
                            required
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Divider className={classes.divider} />
                    </Grid>

                    <Grid item xs={12} style={{ paddingTop: 20 }}>
                        <BulletinTemplate
                            releaseId={release_id}
                        />
                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={downloadHandler(release_id)} color="primary">
                    Download
                </Button>
                <Button color="secondary" onClick={handleSend} disabled={false}>
                    {
                        sent_status ? "Sent already (Send again?)" : "Send"
                    }
                </Button>
                <Button onClick={closeHandler} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(BulletinModal);
