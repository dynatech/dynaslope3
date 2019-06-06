import React, { Fragment } from "react";
import { DateTimePicker } from "material-ui-pickers";
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
                <DateTimePicker
                    required
                    autoOk
                    keyboard
                    label={`Trigger Timestamp (${labelFor})`}
                    value={trigger_timestamp}
                    onChange={changeHandler("trigger_timestamp")}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask={[
                        /\d/, /\d/, /\d/, /\d/, "/",
                        /\d/, /\d/, "/", /\d/, /\d/,
                        " ", /\d/, /\d/, ":", /\d/, /\d/
                    ]}
                    keepCharPositions
                    clearable
                    disableOpenOnEnter
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
                    onChange={changeHandler("tech_info")}
                    fullWidth
                />
            </Grid>
        </Fragment>
    );
}

export default withStyles(styles)(TriggerTimestampAndTechInfoCombo);
