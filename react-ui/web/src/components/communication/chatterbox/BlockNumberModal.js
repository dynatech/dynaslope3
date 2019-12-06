import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useSnackbar } from "notistack";
import { getCurrentUser } from "../../sessions/auth";


function BlockNumberModal (props) {
    const {
        open, setBlockModal, mobileDetails,
        setOpenOptions
    } = props;
    const { sim_num, mobile_id } = mobileDetails;
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const [reason, setReason] = useState("");
    const [error_text, setErrorText] = useState(null);
    const { user_id } = getCurrentUser();

    const handleChange = event => {
        const { target: { value } } = event;
        setReason(value);

        let text = "";
        if (value === "") text = "This is a required field";
        setErrorText(text);
    };

    const handleClose = () => setBlockModal(false);
    const handleExited = () => setReason("");

    const handleBlock = () => {
        if (reason === "") {
            setErrorText("This is a required field");
        } else {
            setBlockModal(false);
            
            const payload = {
                mobile_id,
                reporter_id: user_id,
                reason
            };

            console.log(payload);

            setOpenOptions(false);

            enqueueSnackbar(
                "Mobile number blocked!",
                {
                    variant: "success",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        }
    };

    return (
        <Dialog
            open={open}
            onExited={handleExited}
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
                    onChange={handleChange}
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
                    helperText={error_text}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleBlock} color="secondary">
                    Block
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default React.memo(BlockNumberModal);