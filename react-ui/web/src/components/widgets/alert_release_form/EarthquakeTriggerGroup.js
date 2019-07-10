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

class EarthquakeTriggerGroup extends Component {
    state = {
        switch_earthquake: false,
        trigger_timestamp: null,
        tech_info: "",
        magnitude: "",
        latitude: "",
        longitude: ""
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    };

    handleChange = key => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;
        this.changeState(key, value);
    }

    handleEventChange = key => event => {
        const { value } = event.target;
        this.changeState(key, value);
    }

    handleValueChange = key => value => {
        this.changeState(key, value);
    }

    handleSwitchChange = event => {
        this.changeState("switch_earthquake", event.target.checked);
    }

    render () {
        const { classes } = this.props;
        const {
            switch_earthquake, trigger_timestamp, tech_info,
            magnitude, latitude, longitude
        } = this.state;

        return (
            <Fragment>
                <Grid item xs={12} className={switch_earthquake ? classes.groupGridContainer : ""}>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend" className={classes.formLabel}>
                            <span>Earthquake</span>

                            <Switch
                                checked={switch_earthquake}
                                onChange={this.handleSwitchChange}
                                value="switch_earthquake"
                            />
                        </FormLabel>
                    </FormControl>
                </Grid>

                {
                    switch_earthquake ? (
                        <Fragment>
                            <TriggerTimestampAndTechInfoCombo
                                labelFor="e1"
                                trigger_timestamp={trigger_timestamp}
                                tech_info={tech_info}
                                changeHandler={this.handleChange}
                            />

                            <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                                <TextField
                                    required
                                    id="magnitude"
                                    label="Magnitude"
                                    value={magnitude}
                                    onChange={this.handleEventChange("magnitude")}
                                    type="number"
                                />
                            </Grid>

                            <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                                <TextField
                                    required
                                    id="latitude"
                                    label="Latitude"
                                    value={latitude}
                                    onChange={this.handleEventChange("latitude")}
                                    type="number"
                                />
                            </Grid>

                            <Grid item xs={12} sm={4} className={classes.inputGridContainer}>
                                <TextField
                                    required
                                    id="longitude"
                                    label="Longitude"
                                    value={longitude}
                                    onChange={this.handleEventChange("longitude")}
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
}

export default withStyles(styles)(EarthquakeTriggerGroup);
