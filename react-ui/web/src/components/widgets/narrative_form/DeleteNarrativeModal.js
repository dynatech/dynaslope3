import React from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
import { handleDelete } from "./ajax";

const styles = theme => ({});

function DeleteNarrativeModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenNarrative, 
        setIsUpdateNeeded, isUpdateNeeded
    } = props;
    const { id: narrative_id } = chosenNarrative;

    const handleDeleteClick = () => {
        const payload = {
            narrative_id
        };
        handleDelete(payload, ret => {
            closeHandler();
            console.log("ret", ret);
            console.log("isUpdateNeeded", isUpdateNeeded);
            setIsUpdateNeeded(!isUpdateNeeded);
            console.log("isUpdateNeeded", isUpdateNeeded);
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
                        Are you sure you want to delete this narrative [{narrative_id}]?
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

export default compose(withStyles(styles), withMobileDialog())(DeleteNarrativeModal);
