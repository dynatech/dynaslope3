import React, { useState, Fragment } from "react";
import ReactDOM from "react-dom";
// import moment from "moment";
import {
    Radio, RadioGroup, Dialog, TextField, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog,
    FormControlLabel, FormControl
} from "@material-ui/core";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

// eslint-disable-next-line max-params
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

const ValidationModal = props => {
    const {
        isShowing, hide, data,
        isValidating
    } = props;
    const { site, trigger_id, ts_updated } = data;
    const [triggerValidity, setTriggerValidity] = useState("");
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

    const handleOnClick = key => event => {
        validate_trigger(site, trigger_id, ts_updated, triggerValidity, remarks, 1);
        hide();
    };

    return isShowing ? ReactDOM.createPortal(
        <Fragment>
            <Dialog open onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Validate Trigger</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select whether trigger is valid or invalid. Also, provide remarks.
                    </DialogContentText>
                    <FormControl component="fieldset" style={{ display: "flex" }}>
                        <RadioGroup
                            aria-label="trigger_validity"
                            name="trig_validity_1"
                            row
                            style={{ justifyContent: "space-around" }}
                            value={triggerValidity}
                            onChange={handleChange}
                        >
                            <FormControlLabel value={1} control={<Radio />} label="Valid" />
                            {
                                !isValidating && (
                                    <FormControlLabel value={0} control={<Radio />} label="Validating" />
                                )
                            }
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


export default withMobileDialog()(ValidationModal);
