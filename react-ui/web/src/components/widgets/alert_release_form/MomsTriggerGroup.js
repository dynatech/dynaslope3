import React, { Fragment, useState } from "react";
import moment from "moment";
import { Grid, withStyles, FormControl,
    FormLabel, Typography, TextField } from "@material-ui/core";

import CheckboxGroupWithSwitch from "../../reusables/CheckboxGroupWithSwitch";
import { handleChange, handleCheckboxChange, handleSwitchChange } from "./state_handlers";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});

function MomsTriggerGroup (props) {
    const {
        classes, triggersState
    } = props;

    const [trigger_type, setTriggerType] = useState("");
    const [last_trigger_ts, setLastTriggerTs] = useState("");
    const [tech_info, setTechInfo] = useState("");

    const { moms } = triggersState;
    const { switchState, triggers } = moms;

    const triggers_value = {
        trigger_2: { status: false, disabled: false },
        trigger_3: { status: false, disabled: false },
        trigger_0: { status: false, disabled: false },
    };

    if (triggers.length !== 0) {
        setTriggerType("m2");
        setLastTriggerTs(moment().format("YYYY-MM-DD HH:mm:00"));
        setTechInfo("Significant crack found in site.");
        triggers.forEach(trigger => {
            const { alert_level, status, disabled } = trigger;
            triggers_value[`trigger_${alert_level}`] = {
                ...trigger,
                status,
                disabled
            };

            if (alert_level === 0) {
                triggers_value.trigger_2.disabled = true;
                triggers_value.trigger_3.disabled = true;
            } else {
                triggers_value.trigger_0.disabled = true;
            }
        });
    }

    const techInfoHandler = () => {
        // TO DO:
        console.log("change has been made");
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" className={classes.formLabel}>
                        <span>MOMs</span>
                    </FormLabel>
                </FormControl>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body2">Note: If you want to add/include MOMS in the release, insert MOMS using its MOMS Insert Form</Typography>
                    </Grid>
                    {
                        triggers.length === 0 && (
                            <Fragment>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">Trigger: {trigger_type}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">Last trigger timestamp: {last_trigger_ts}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                                    <TextField
                                        required
                                        label="Technical Info"
                                        multiline
                                        rowsMax="2"
                                        placeholder="Enter technical info for 'MOMs' trigger"
                                        value={tech_info}
                                        onChange={techInfoHandler}
                                        fullWidth
                                    />
                                </Grid>
                            </Fragment>                            
                        )
                    }
                </Grid>
                
            </Grid>
        </Fragment>
    );
}

export default withStyles(styles)(MomsTriggerGroup);
