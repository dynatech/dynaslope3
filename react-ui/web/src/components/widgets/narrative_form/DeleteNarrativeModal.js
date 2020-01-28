import React from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";
import { handleDelete } from "./ajax";

function DeleteNarrativeModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenNarrative, 
        setIsUpdateNeeded, isUpdateNeeded
    } = props;
    const { id: narrative_id, narrative } = chosenNarrative;

    const handleDeleteClick = () => {
        const payload = {
            narrative_id
        };
        handleDelete(payload, ret => {
            closeHandler();
            console.log("ret", ret);
            setIsUpdateNeeded(!isUpdateNeeded);
        });
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"

            >
                <DialogTitle id="form-dialog-title">Site Logs Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this narrative?
                    </DialogContentText>
                    <DialogContentText align="center">
                        { `"${narrative}"` }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <div>
                        <Button onClick={closeHandler} color="primary">
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleDeleteClick} disabled={false}>
                            Confirm
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(DeleteNarrativeModal);
