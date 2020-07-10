import React, { useState, useContext } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions, Button, withMobileDialog,
    DialogContentText, 
} from "@material-ui/core";
import { useSnackbar } from "notistack";

import EditSiteInformationForm from "./EditSiteInformationForm";
import { saveSiteInformation } from "../ajax";
import { GeneralContext } from "../../contexts/GeneralContext";

function EditSiteInformationModal (props) {
    const {
        fullScreen, isOpen, seasons,
        editButtonAction, siteInformation
    } = props;

    const { setRefreshSites } = useContext(GeneralContext);

    const [site_information_data, setSiteInformationData] = useState(null);
    const [is_disable, setIsDisable] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const handleSubmit = () => {
        saveSiteInformation(site_information_data, data => {
            const { status, message } = data;
            if (status === "success") {
                handleClose();
                setRefreshSites(true);
            }

            enqueueSnackbar(
                message,
                {
                    variant: status,
                    autoHideDuration: 3000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const handleClose = () => {
        editButtonAction(false);
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">Edit site information</DialogTitle>
            <DialogContent>
                <DialogContentText>Update necessary fields of site information form then save.</DialogContentText>

                <EditSiteInformationForm 
                    siteInformation={siteInformation}
                    setSiteInformationData={setSiteInformationData}
                    seasons={seasons}
                    setIsDisable={setIsDisable}
                />
            </DialogContent>
            <DialogActions>
                    
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onClick={handleSubmit}
                    disabled={is_disable}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(EditSiteInformationModal);
