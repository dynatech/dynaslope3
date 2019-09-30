import React, { useState, useEffect } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
// import AlertReleaseForm from "./AlertReleaseForm";
import { handleDelete } from "./ajax";

const styles = theme => ({
    inputGridContainer: {
        marginTop: 8,
        marginBottom: 8
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    }
});


function DeleteNarrativeModal (props) {
    const {
        classes, fullScreen, isOpen,
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
