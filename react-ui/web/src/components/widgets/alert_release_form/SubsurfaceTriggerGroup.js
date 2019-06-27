import React, { Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";

import CheckboxGroupWithSwitch from "../../reusables/CheckboxGroupWithSwitch";
import { handleChange, handleCheckboxChange, handleSwitchChange } from "./state_handlers";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});

function SubsurfaceCheckboxGroup (props) {
    const {
        classes, triggersState, setTriggersState
    } = props;

    const { subsurface } = triggersState;
    const { switchState, triggers } = subsurface;

    const triggers_value = {
        trigger_2: { status: false, disabled: false },
        trigger_3: { status: false, disabled: false },
        trigger_0: { status: false, disabled: false },
    };

    if (triggers.length !== 0) {
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

    const { trigger_2, trigger_3, trigger_0 } = triggers_value;

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <CheckboxGroupWithSwitch
                    label="Subsurface"
                    switchState={switchState}
                    switchHandler={handleSwitchChange(setTriggersState, "subsurface")}
                    switchValue="subsurface_switch"
                    choices={[
                        { state: trigger_2, value: 2, label: "Release trigger (s2)" },
                        { state: trigger_3, value: 3, label: "Release trigger (S3)" },
                        { state: trigger_0, value: 0, label: "No data ([s/S]0)" }
                    ]}
                    changeHandler={handleCheckboxChange(setTriggersState, "subsurface")}
                />
            </Grid>
            {
                trigger_2.status && switchState ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="s2"
                        trigger_timestamp={trigger_2.timestamp}
                        tech_info={trigger_2.tech_info}
                        changeHandler={handleChange(setTriggersState, "subsurface")}
                    />
                ) : (
                    <div />
                )
            }

            {
                trigger_3.status && switchState ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="S3"
                        trigger_timestamp={trigger_3.timestamp}
                        tech_info={trigger_3.tech_info}
                        changeHandler={handleChange(setTriggersState, "subsurface")}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(SubsurfaceCheckboxGroup);
