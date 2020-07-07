import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogActions, Button, withMobileDialog
} from "@material-ui/core";
import { useSnackbar } from "notistack";

import EditSiteInformationForm from "./EditSiteInformationForm";
import { saveSiteInformation } from "../ajax";

function EditSiteInformationModal (props) {
    const {
        fullScreen, isOpen, seasons,
        editButtonAction, siteInformation
    } = props;
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
            if (status === "success") handleClose();

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

    useEffect(() => {
        if (site_information_data) {
            const { 
                current_site_code, current_purok, current_sitio,
                current_barangay, current_municipality, current_province,
                current_region, current_psgc, current_is_active,
                current_households, current_season, site_id
            } = site_information_data;
            if (
                current_site_code === "" ||
            current_barangay === "" ||
            current_municipality === "" ||
            current_province === "" ||
            current_region === "" ||
            current_psgc === "" ||
            current_is_active === "" ||
            current_households === "" ||
            current_season === "" ||
            site_id === ""
            ) {
                setIsDisable(true);
            } else {
                setIsDisable(false);
            }
        }
    }, [site_information_data]);
    
    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Edit Site Information Form</DialogTitle>
                <DialogContent>
                    <EditSiteInformationForm 
                        setSiteInformationData={setSiteInformationData}
                        siteInformation={siteInformation}
                        seasons={seasons}
                        handleSubmit={handleSubmit}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <div>
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
                        </div>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(EditSiteInformationModal);