import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";

function BlockNumberModal (props) {
    const { open, setBlockModal, mobileDetails } = props;
    const { sim_num } = mobileDetails;

    const [reason, setReason] = useState("");

    const handleClose = () => {
        setBlockModal(false);
    }; 

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{`Block mobile number (+${sim_num})`}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Provide the reason for blocking this mobile number from Chatterbox
                </DialogContentText>
                <TextField
                    autoFocus
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    margin="dense"
                    id="reason"
                    label="Reason"
                    multiline
                    fullWidth
                    required
                    placeholder="Enter reason"
                    inputProps={{
                        maxLength: 500
                    }}
                    error={reason === ""}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleClose} color="secondary">
                    Block
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default React.memo(BlockNumberModal);