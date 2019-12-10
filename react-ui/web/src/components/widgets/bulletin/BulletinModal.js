import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions,
    Button, withMobileDialog, Divider,
    Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";

import moment from "moment";
import BulletinTemplate from "./BulletinTemplate";
import { downloadBulletin, getBulletinEmailDetails, write_bulletin_narrative } from "./ajax";
import { sendBulletinEmail } from "../../communication/mailbox/ajax";

const default_data = {
    mail_content: "",
    recipients: [],
    next_bulletin_sched_notice: "",
    sent_status: false
};

function BulletinModal (props) {
    const {
        classes, fullScreen, isOpenBulletinModal,
        setIsOpenBulletinModal,
        releaseDetail
    } = props;
    const {
        release_id, site_code, site_id
    } = releaseDetail;

    // const [bulletin_modal_data, setBulletinModalData] = useState({});
    const [mail_subject, setMailSubject] = useState("");
    const [mail_recipients, setMailRecipients] = useState([]);
    const [mail_content, setMailContent] = useState("");
    const [file_name, setFileName] = useState("");
    const [sent_status, setSentStatus] = useState(false);
    const [narrative_details, setNarrativeDetails] = useState({});

    useEffect(() => {
        if (typeof release_id !== "undefined") {
            getBulletinEmailDetails(release_id, ret => {
                const {
                    subject, recipients, mail_body,
                    file_name: filename,
                    narrative_details: tmp_nar
                } = ret;

                setNarrativeDetails(tmp_nar);
    
                typeof recipients === "object" ? 
                    setMailRecipients([recipients[0].TEST_SERVER_EMAIL]) 
                    : 
                    setMailRecipients(recipients);
    
                setMailSubject(subject);
                setMailContent(mail_body);
                setFileName(filename);
            });
        }
    }, [releaseDetail]);

    const downloadHandler = release_id_input => () => {
        downloadBulletin(release_id_input, ret => {
            console.log("LOG bulletin_download", ret);
        });
    };

    const closeHandler = () => setIsOpenBulletinModal(false);

    const handleSend = () => {
        const input = {
            subject: mail_subject,
            recipients: mail_recipients,
            mail_body: mail_content,
            release_id,
            file_name 
        };

        sendBulletinEmail(input, ret => {
            if (typeof narrative_details === "object") {
                const temp_nar = {
                    ...narrative_details,
                    timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
                };
                write_bulletin_narrative(temp_nar, narrative_ret => {
                    closeHandler();
                });
            } else console.log("NO NARRATIVE WRITTEN: TEST ONLY");
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
