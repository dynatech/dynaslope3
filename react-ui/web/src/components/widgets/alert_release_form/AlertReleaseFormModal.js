import React, { Component } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog
} from "@material-ui/core";
import { compose } from "recompose";
import CircularAddButton from "../../reusables/CircularAddButton";
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

class AlertReleaseFormModal extends Component {
    state = {
        open: false,
    };

    handleClickOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    };
   
    render () {
        const { classes, fullScreen } = this.props;
        const { open } = this.state;

        return (
            <div>
                <CircularAddButton
                    clickHandler={this.handleClickOpen}
                />

                <Dialog
                    fullWidth
                    fullScreen={fullScreen}
                    open={open}
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
                        <Button onClick={this.handleClose} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={this.handleClose} color="primary">
                            Submit
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default compose(withStyles(styles), withMobileDialog())(AlertReleaseFormModal);
