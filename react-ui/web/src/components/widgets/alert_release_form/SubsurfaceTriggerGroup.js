import React, { Component, Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";
import CheckboxGroupWithSwitch from "../../reusables/CheckboxGroupWithSwitch";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});

class SubsurfaceCheckboxGroup extends Component {
    state = {
        switch_subsurface: false,
        trigger_timestamp: null,
        tech_info: "",
        trigger_s: {
            status: false,
            disabled: false
        },
        trigger_S: {
            status: false,
            disabled: false
        },
        trigger_s0: {
            status: false,
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

    handleSwitchChange = event => {
        const temp = { ...this.state };
        const is_checked = event.target.checked;
        temp.switch_subsurface = is_checked;

        if (!is_checked) {
            ["trigger_s", "trigger_S", "trigger_s0"].forEach(e => {
                temp[e].status = false;
                temp[e].disabled = false;
            });
        }

        this.setState(temp);
    }

    handleCheckboxChange = name => event => {
        const final_state = { ...this.state };
        const is_checked = event.target.checked;

        if (name === "trigger_s0") {
            final_state.trigger_s.disabled = is_checked;
            final_state.trigger_S.disabled = is_checked;
        }

        final_state[name].status = is_checked;

        this.setState(final_state, prevState => {
            if (name !== "trigger_s0") {
                const x = (final_state.trigger_s.status || final_state.trigger_S.status);
                this.setState({ trigger_s0: { status: false, disabled: x } });
            }
        });
    }

    render () {
        const { classes } = this.props;
        const { 
            switch_subsurface, 
            trigger_s, trigger_S, trigger_s0,
            trigger_timestamp, tech_info
        } = this.state;

        return (
            <Fragment>
                <Grid item xs={12} className={switch_subsurface ? classes.groupGridContainer : ""}>
                    <CheckboxGroupWithSwitch
                        label="Subsurface"
                        switchState={switch_subsurface}
                        switchHandler= {this.handleSwitchChange}
                        switchValue="switch_subsurface"
                        choices={[
                            { state: trigger_s, value: "trigger_s", label: "Release trigger (s2)" },
                            { state: trigger_S, value: "trigger_S", label: "Release trigger (S3)" },
                            { state: trigger_s0, value: "trigger_s0", label: "No data ([s/S]0)" }
                        ]}
                        changeHandler={this.handleCheckboxChange}
                    />
                </Grid>

                {
                    trigger_s.status ? (
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="s2"
                            trigger_timestamp={trigger_timestamp}
                            tech_info={tech_info}
                            changeHandler={this.handleChange}
                        />
                    ) : (
                        <div />
                    )
                }

                {
                    trigger_S.status ? (
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="S3"
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

export default withStyles(styles)(SubsurfaceCheckboxGroup);
