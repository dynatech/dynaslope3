import React, { Fragment } from "react";
import {
    Grid, withStyles, FormControl,
    Switch, TextField,
    FormControlLabel
} from "@material-ui/core";

import { handleChange, handleEventChange, handleSwitchChange } from "./state_handlers";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        justifyContent: "space-between",
        marginLeft: 0,
    },
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 0
    },
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    }
});

function EarthquakeTriggerGroup (props) {
    const {
        classes, triggersState, setTriggersState
    } = props;

    const { earthquake } = triggersState;
    const { switchState, triggers } = earthquake;

    let eq_trig = {
        timestamp: null,
        tech_info: "",
        magnitude: null,
        latitude: null,
        longitude: null
    };
    if (triggers.length !== 0) {
        eq_trig = { ...triggers[0] }; // There is always only ONE EQ trigger
    }

    const { timestamp, tech_info, magnitude, latitude, longitude } = eq_trig;

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    {/* <FormLabel component="legend" className={classes.formLabel}>
                        <span>Earthquake</span>

                        <Switch
                            checked={switchState}
                            onChange={handleSwitchChange(setTriggersState, "earthquake")}
                            value="switch_earthquake"
                        />
                    </FormLabel> */}

                    <FormControlLabel
                        className={classes.formLabel}
                        control={<Switch
                            checked={switchState}
                            onChange={handleSwitchChange(setTriggersState, "earthquake")}
                            value="switch_earthquake"
                        />}
                        label="Earthquake"
                        labelPlacement="start"
                    />
                </FormControl>
            </Grid>

            {
                switchState ? (
                    <Fragment>
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="e1"
                            trigger_timestamp={timestamp}
                            tech_info={tech_info}
                            changeHandler={handleChange(setTriggersState, "earthquake")}
                        />

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="magnitude"
                                label="Magnitude"
                                value={magnitude}
                                onChange={handleEventChange("magnitude", setTriggersState, "earthquake")}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="latitude"
                                label="Latitude"
                                value={latitude}
                                onChange={handleEventChange("latitude", setTriggersState, "earthquake")}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="longitude"
                                label="Longitude"
                                value={longitude}
                                onChange={handleEventChange("longitude", setTriggersState, "earthquake")}
                                type="number"
                            />
                        </Grid>
                    </Fragment>
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(EarthquakeTriggerGroup);
