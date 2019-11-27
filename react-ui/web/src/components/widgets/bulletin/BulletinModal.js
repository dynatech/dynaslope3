import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions,
    Button, withMobileDialog, Divider,
    Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";

import BulletinTemplate from "./BulletinTemplate";

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
        release_id, site_code, is_onset
    } = releaseDetail;

    const [bulletin_modal_data, setBulletinModalData] = useState({});

    useEffect(() => {
        setBulletinModalData(default_data);

        const temp = ["rusolidum@phivolcs.dost.gov.ph", "asdaag@phivolcs.dost.gov.ph"];
        if (is_onset) {
            temp.push(...["dynapips", "senslopepips"]);
        }
        setBulletinModalData({
            ...bulletin_modal_data,
            recipients: temp
        });
    }, [releaseDetail]);

    const downloadHandler = () => {
        console.log("Requested download however this feature is still a work in progress.");
    };

    const closeHandler = () => setIsOpenBulletinModal(false);

    const handleSend = () => {
        console.log("Clicked submit!");
        closeHandler();
    };

    const changeHandler = key => value => {
        setBulletinModalData({
            ...bulletin_modal_data,
            key: value
        });
    };

    
    const handleAddChip = (chip) => {
        const temp = bulletin_modal_data.recipients.push(chip);
        setBulletinModalData({
            ...bulletin_modal_data,
            ...temp
        });
    };

    const handleDeleteChip = (chip, index) => {
        const temp = bulletin_modal_data.recipients.splice( bulletin_modal_data.recipients.indexOf(chip), 1 );
        setBulletinModalData({
            ...bulletin_modal_data,
            ...temp
        });
    };

    const {
        mail_content, sent_status, recipients
    } = bulletin_modal_data;

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
                            onChange={changeHandler("mail_content")}
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
                            value={recipients}
                            onAdd={(chip) => handleAddChip(chip)}
                            onDelete={(chip, index) => handleDeleteChip(chip, index)}
                            fullWidth
                            required
                        />
                        {/* <TextField
                            required
                            label="Recipients"
                            value={recipients}
                            onChange={changeHandler("recipients")}
                            placeholder="Add mail recipients"
                            multiline
                            rowsMax={6}
                            fullWidth
                            className={classes.textField}
                        /> */}
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Divider className={classes.divider} />
                    </Grid>

                    <Grid item xs={12} style={{ textAlign: "center", paddingTop: 20 }}>
                        <BulletinTemplate
                            releaseId={release_id}
                        />
                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={downloadHandler} color="primary">
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
