import React, { Component, Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";
import RadioGroup from "../../reusables/RadioGroupWithSwitch";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});


class RainfallRadioGroup extends Component {
    state = {
        switch_rainfall: false,
        rainfall: "",
        trigger_timestamp: null,
        tech_info: "",
        trigger_r: {
            disabled: false
        },
        trigger_r0: {
            disabled: false
        },
        trigger_rx: {
            disabled: false
        }
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    };

    handleChange = key => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;
        this.changeState(key, value);
    }

    handleSwitchChange = () => event => {
        const is_checked = event.target.checked;
        this.setState({ switch_rainfall: is_checked });

        if (!is_checked) this.setState({ rainfall: "" });
    }

    handleRadioChange = event => {
        this.setState({ rainfall: event.target.value });
    }

    render () {
        const { classes } = this.props;
        const {
            switch_rainfall, rainfall, 
            trigger_r, trigger_r0, trigger_rx,
            trigger_timestamp, tech_info 
        } = this.state;

        return (
            <Fragment>
                <Grid item xs={12} className={switch_rainfall ? classes.groupGridContainer : ""}>
                    <RadioGroup 
                        label="Rainfall"
                        id="rainfall"
                        switchState={switch_rainfall}
                        switchHandler= {this.handleSwitchChange()}
                        switchValue="switch_rainfall"
                        radioValue={rainfall}
                        choices={[
                            { state: trigger_r, value: "trigger_r", label: "Release new trigger" },
                            { state: trigger_r0, value: "trigger_r0", label: "No data (R0)" },
                            { state: trigger_rx, value: "trigger_rx", label: "Intermediate threshold (rx)" }
                        ]}
                        changeHandler={this.handleRadioChange}
                    />
                </Grid>

                {
                    rainfall === "trigger_r" ? (
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="R"
                            trigger_timestamp={trigger_timestamp}
                            tech_info={tech_info}
                            changeHandler={this.handleChange}
                        />
                    ) : (
                        <div />
                    )
                }
            </Fragment>
        );
    }
}

export default withStyles(styles)(RainfallRadioGroup);
