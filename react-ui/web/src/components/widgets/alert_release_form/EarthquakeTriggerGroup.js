import React, { Component, Fragment } from "react";
import {
    Grid, withStyles, FormControl,
    FormLabel, Switch, TextField, Hidden
} from "@material-ui/core";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
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
    const { classes, earthquakeTriggerData, setEarthquakeTriggerData } = props;

    const {
        switchEarthquake, triggerTimestamp,
        techInfo, magnitude,
        latitude, longitude
    } = earthquakeTriggerData;

    const handleChange = (key, element_id) => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            if (element_id === "ts_e1") setEarthquakeTriggerData({
                ...earthquakeTriggerData,
                triggerTimestamp: value
            });
        } else {
            console.log("");
            if (element_id === "tech_info_e1") setEarthquakeTriggerData({
                ...earthquakeTriggerData,
                techInfo: value
            });
        }
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        setEarthquakeTriggerData({
            ...earthquakeTriggerData, [key]: value
        });
    };

    const handleSwitchChange = event => {
        const is_checked = event.target.checked;

        setEarthquakeTriggerData(previous => ({ ...previous, switchEarthquake: is_checked }));
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchEarthquake ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" className={classes.formLabel}>
                        <span>Earthquake</span>

                        <Switch
                            checked={switchEarthquake}
                            onChange={handleSwitchChange}
                            value="switchEarthquake"
                        />
                    </FormLabel>
                </FormControl>
            </Grid>

            {
                switchEarthquake ? (
                    <Fragment>
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="e1"
                            trigger_timestamp={triggerTimestamp}
                            tech_info={techInfo}
                            changeHandler={handleChange}
                        />

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="magnitude"
                                label="Magnitude"
                                value={magnitude}
                                onChange={handleEventChange("magnitude")}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="latitude"
                                label="Latitude"
                                value={latitude}
                                onChange={handleEventChange("latitude")}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="longitude"
                                label="Longitude"
                                value={longitude}
                                onChange={handleEventChange("longitude")}
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
