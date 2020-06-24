import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions,
    Button, withMobileDialog, Divider,
    Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";

import { useSnackbar } from "notistack";
import BulletinTemplate from "./BulletinTemplate";
import { downloadBulletin, getBulletinEmailDetails } from "./ajax";
import { sendBulletinEmail } from "../../communication/mailbox/ajax";
import { getCurrentUser } from "../../sessions/auth";


function BulletinModal (props) {
    const {
        classes, fullScreen, isOpenBulletinModal,
        setIsOpenBulletinModal, releaseDetail
    } = props;
    const {
        release_id, site_code, site_id,
        type, // either "latest", "extended", "overdue"
        is_bulletin_sent
    } = releaseDetail;

    const [mail_subject, setMailSubject] = useState("");
    const [mail_recipients, setMailRecipients] = useState([]);
    const [mail_content, setMailContent] = useState("");
    const [file_name, setFileName] = useState("");
    const [narrative_details, setNarrativeDetails] = useState({});
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const { user_id: sender_id } = getCurrentUser();

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
                    narrative_details: temp_nar
                } = ret;

                setNarrativeDetails(temp_nar);
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
            file_name,
            alert_db_group: type,
            site_id,
            sender_id,
            narrative_details
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
            console.log("Sent bulletin email...", ret);
            const { status, message } = ret;
            closeSnackbar(loading_snackbar);
            let variant;
            if (status) {
                variant = "success";
            } else {
                variant = "error";
            }
            enqueueSnackbar(
                message,
                {
                    variant,
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
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
                        is_bulletin_sent ? "Sent already (Send again?)" : "Send"
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
