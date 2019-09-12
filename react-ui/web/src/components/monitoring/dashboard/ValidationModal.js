import React, { useEffect, useState, Fragment } from "react";
import ReactDOM from "react-dom";
// import moment from "moment";
import {
    Radio, RadioGroup, Dialog, TextField, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withStyles, withMobileDialog,
    FormControlLabel, FormControl,
    FormLabel
} from "@material-ui/core";
// import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

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

function validate_trigger (site_code, trigger_id, trigger_ts, alert_status, remarks, user_id) {
    const data = {
        site_code,
        alert_status,
        trigger_id,
        trigger_ts,
        remarks,
        user_id
    };
    sendWSMessage("validate_trigger", data);
}

const ValidationModal = ({ isShowing, hide, classes, data }) => {
    const { site, trigger_id, ts_updated } = data;
    const [triggerValidity, setTriggerValidity] = useState(1);
    const [remarks, setRemarks] = useState("");
    const validation_data = { site, trigger_id, ts_updated, triggerValidity, remarks, user_id: 1 };

    function handleChange (event) {
        const trigger_validity = Number.parseInt(event.target.value, 10);
        setTriggerValidity(trigger_validity);
    }

    function handleRemarksChange (event) {
        setRemarks(event.target.value);
    }

    function handleClose () {
        setTriggerValidity(0);
        setRemarks("");
        hide();
    }

    const handleOnClick = (key) => (event) => {
        validate_trigger(site, trigger_id, ts_updated, triggerValidity, remarks, 1);
        hide();
    };

    return isShowing ? ReactDOM.createPortal(
        <Fragment>
            <Dialog open onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Validate Trigger</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please tell us if the server is valid or invalid. Also, provide remarks.
                    </DialogContentText>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Is trigger valid?</FormLabel>
                        <RadioGroup
                            aria-label="trigger_validity"
                            name="trig_validity_1"
                            className={classes.group}
                            value={triggerValidity}
                            onChange={handleChange}
                        >
                            <FormControlLabel value={1} control={<Radio />} label="Valid" />
                            <FormControlLabel value={-1} control={<Radio />} label="Invalid" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="remarks"
                        label="Remarks"
                        onChange={handleRemarksChange}
                        value={remarks}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleOnClick(validation_data)} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Fragment>, document.body
    ) : null;
};


export default compose(withStyles(styles), withMobileDialog())(ValidationModal);
