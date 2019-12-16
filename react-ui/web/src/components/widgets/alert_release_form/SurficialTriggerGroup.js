import React, { Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";

import { handleChange, handleCheckboxChange, handleSwitchChange } from "./state_handlers";
import CheckboxGroupWithSwitch from "../../reusables/CheckboxGroupWithSwitch";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});

function SurficialCheckboxGroup (props) {
    const {
        classes, triggersState, setTriggersState,
        triggersReleased
    } = props;

    const { surficial } = triggersState;
    const { switchState, triggers } = surficial;

    const triggers_value = {
        trigger_2: { status: false, disabled: false },
        trigger_3: { status: false, disabled: false },
        trigger_nd: { status: false, disabled: false },
    };

    if (triggers.length !== 0) {
        triggers.forEach(trigger => {
            const { alert_level, status, disabled } = trigger;
            triggers_value[`trigger_${alert_level}`] = {
                ...trigger,
                status,
                disabled
            };

            if (alert_level === "nd") {
                triggers_value.trigger_2.disabled = true;
                triggers_value.trigger_3.disabled = true;
            } else {
                triggers_value.trigger_nd.disabled = true;
            }
        });
    }

    const { trigger_2, trigger_3, trigger_nd } = triggers_value;

    const checkbox_choices = [
        { state: trigger_2, value: 2, label: "Release trigger (g2)" },
        { state: trigger_3, value: 3, label: "Release trigger (G3)" }
    ];

    const row = triggersReleased.filter(r => r.trigger_source === "surficial");
    if (row.length > 0) {
        const temp = row.pop();
        checkbox_choices.push({
            state: trigger_nd, value: "nd", label: "No data ([g/G]0)"
        });

        if (temp.alert_level === -1) { 
            triggers_value.trigger_nd.status = true;
            triggers_value.trigger_nd.disabled = false;
        }
    }

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <CheckboxGroupWithSwitch
                    label="Surficial"
                    switchState={switchState}
                    switchHandler={handleSwitchChange(setTriggersState, "surficial")}
                    switchValue="surficial_switch"
                    choices={checkbox_choices}
                    changeHandler={handleCheckboxChange(setTriggersState, "surficial")}
                />
            </Grid>
            {
                trigger_2.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="g2"
                        trigger_timestamp={trigger_2.timestamp}
                        tech_info={trigger_2.tech_info}
                        changeHandler={handleChange(setTriggersState, "surficial")}
                    />
                ) : (
                    <div />
                )
            }

            {
                trigger_3.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="G3"
                        trigger_timestamp={trigger_3.timestamp}
                        tech_info={trigger_3.tech_info}
                        changeHandler={handleChange(setTriggersState, "surficial")}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(SurficialCheckboxGroup);
