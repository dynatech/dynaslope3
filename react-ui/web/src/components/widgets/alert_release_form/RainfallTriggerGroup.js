import React, { Component, Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";

import { handleChange, handleRadioChange, handleSwitchChange } from "./state_handlers";
import RadioGroup from "../../reusables/RadioGroupWithSwitch";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});


function RainfallRadioGroup (props) {
    const {
        classes, triggersState, setTriggersState
    } = props;

    const { rainfall } = triggersState;
    const { switchState, triggers } = rainfall;

    let triggers_value = { alert_level: "" };
    if (triggers.length !== 0) {
        triggers.forEach(trigger => {
            triggers_value = { ...trigger, alert_level: `${trigger.alert_level}` };
        });
    }

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <RadioGroup
                    label="Rainfall"
                    id="rainfall"
                    switchState={switchState}
                    switchHandler={handleSwitchChange(setTriggersState, "rainfall")}
                    switchValue="rainfall_switch"
                    radioValue={triggers_value.alert_level}
                    choices={[
                        { value: "1", label: "Release new trigger" },
                        { value: "0", label: "No data (R0)" },
                        { value: "-2", label: "Intermediate threshold (rx)" }
                    ]}
                    changeHandler={handleRadioChange(setTriggersState, "rainfall")}
                />
            </Grid>

            {
                triggers_value.alert_level === "1" ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="R1"
                        trigger_timestamp={triggers_value.timestamp}
                        tech_info={triggers_value.tech_info}
                        changeHandler={handleChange(setTriggersState, "rainfall")}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(RainfallRadioGroup);