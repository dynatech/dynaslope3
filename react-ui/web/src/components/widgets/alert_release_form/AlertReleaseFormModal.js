import React, { Component } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
import AlertReleaseForm from "./AlertReleaseForm";

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

function AlertReleaseFormModal (props) {
    const { classes, fullScreen, isOpen, closeHandler } = props;

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"
                    
            >
                <DialogTitle id="form-dialog-title">Alert Release Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                            Provide accurate details to manually release an alert.
                    </DialogContentText>
                        
                    <AlertReleaseForm />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} color="primary">
                            Cancel
                    </Button>
                    <Button onClick={closeHandler} color="primary">
                            Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(AlertReleaseFormModal);
