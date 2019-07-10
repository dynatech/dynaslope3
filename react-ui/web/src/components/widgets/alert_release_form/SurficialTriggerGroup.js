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
        switch_surficial: false,
        trigger_timestamp: null,
        tech_info: "",
        trigger_g: {
            status: false,
            disabled: false
        },
        trigger_G: {
            status: false,
            disabled: false
        },
        trigger_g0: {
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
        temp.switch_surficial = is_checked;

        if (!is_checked) {
            ["trigger_g", "trigger_G", "trigger_g0"].forEach(e => {
                temp[e].status = false;
                temp[e].disabled = false;
            });
        }

        this.setState(temp);
    }

    handleCheckboxChange = name => event => {
        const final_state = { ...this.state };
        const is_checked = event.target.checked;

        if (name === "trigger_g0") {
            final_state.trigger_g.disabled = is_checked;
            final_state.trigger_G.disabled = is_checked;
        }

        final_state[name].status = is_checked;

        this.setState(final_state, prevState => {
            if (name !== "trigger_g0") {
                const x = (final_state.trigger_g.status || final_state.trigger_G.status);
                this.setState({ trigger_g0: { status: false, disabled: x } });
            }
        });
    }

    render () {
        const { classes } = this.props;
        const {
            switch_surficial,
            trigger_g, trigger_G, trigger_g0,
            trigger_timestamp, tech_info
        } = this.state;

        return (
            <Fragment>
                <Grid item xs={12} className={switch_surficial ? classes.groupGridContainer : ""}>
                    <CheckboxGroupWithSwitch 
                        label="Surficial"
                        switchState={switch_surficial}
                        switchHandler= {this.handleSwitchChange}
                        switchValue="switch_surficial"
                        choices={[
                            { state: trigger_g, value: "trigger_g", label: "Release trigger (g2)" },
                            { state: trigger_G, value: "trigger_G", label: "Release trigger (G3)" },
                            { state: trigger_g0, value: "trigger_g0", label: "No data ([g/G]0)" }
                        ]}
                        changeHandler={this.handleCheckboxChange}
                    />
                </Grid>

                {
                    trigger_g.status ? (
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="g2"
                            trigger_timestamp={trigger_timestamp}
                            tech_info={tech_info}
                            changeHandler={this.handleChange}
                        />
                    ) : (
                        <div />
                    )
                }

                {
                    trigger_G.status ? (
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="G3"
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
