import React, { Component, Fragment } from "react";
import {
    Grid, withStyles, FormControl,
    FormLabel, Switch, TextField
} from "@material-ui/core";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";
import SelectInputForm from "../../reusables/SelectInputForm";

const community_contacts = [{ user_id: 1, name: "MLGU Something" }, { user_id: 2, name: "LEWC Chenes" }, { user_id: 3, name: "BLGU Chos" }];

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

class OnDemandTriggerGroup extends Component {
    state = {
        switch_on_demand: false,
        trigger_timestamp: null,
        tech_info: "",
        reason: "",
        reporter_id: ""

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
        this.changeState("switch_on_demand", event.target.checked);
    }

    render () {
        const { classes } = this.props;
        const {
            switch_on_demand, trigger_timestamp, tech_info,
            magnitude, reason, longitude, reporter_id
        } = this.state;

        return (
            <Fragment>
                <Grid item xs={12} className={switch_on_demand ? classes.groupGridContainer : ""}>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend" className={classes.formLabel}>
                            <span>On Demand</span>

                            <Switch
                                checked={switch_on_demand}
                                onChange={this.handleSwitchChange}
                                value="switch_on_demand"
                            />
                        </FormLabel>
                    </FormControl>
                </Grid>

                {
                    switch_on_demand ? (
                        <Fragment>
                            <TriggerTimestampAndTechInfoCombo
                                labelFor="d1"
                                trigger_timestamp={trigger_timestamp}
                                tech_info={tech_info}
                                changeHandler={this.handleChange}
                            />

                            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                                <TextField
                                    required
                                    id="reason"
                                    label="Reason"
                                    value={reason}
                                    onChange={this.handleEventChange("reason")}
                                    placeholder="Enter reason of on-demand request"
                                    multiline
                                    rowsMax={2}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                                <SelectInputForm
                                    label="Reporter"
                                    div_id="reporter_id"
                                    changeHandler={this.handleEventChange("reporter_id")}
                                    value={reporter_id}
                                    list={community_contacts}
                                    mapping={{ id: "user_id", label: "name" }}
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

export default withStyles(styles)(OnDemandTriggerGroup);
