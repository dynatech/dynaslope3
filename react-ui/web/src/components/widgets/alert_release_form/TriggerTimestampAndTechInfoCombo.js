import React, { Fragment } from "react";
import { KeyboardDateTimePicker } from "@material-ui/pickers";
import { Grid, withStyles, TextField } from "@material-ui/core";

const styles = theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    }
});

function TriggerTimestampAndTechInfoCombo (props) {
    const {
        classes, changeHandler, labelFor,
        trigger_timestamp, tech_info
    } = props;

    return (
        <Fragment>
            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    label={`Trigger Timestamp (${labelFor})`}
                    value={trigger_timestamp}
                    onChange={changeHandler("timestamp", labelFor)}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask="__/__/__ __:__"
                    clearable
                    disableFuture
                    fullWidth
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <TextField
                    required
                    label={`Technical Information (${labelFor})`}
                    multiline
                    rowsMax="2"
                    placeholder={`Enter technical info for "${labelFor}" trigger`}
                    value={tech_info}
                    onChange={changeHandler("tech_info", labelFor)}
                    fullWidth
                />
            </Grid>
        </Fragment>
    );
}

export default withStyles(styles)(TriggerTimestampAndTechInfoCombo);
