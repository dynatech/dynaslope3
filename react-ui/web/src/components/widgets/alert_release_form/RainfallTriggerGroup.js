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


function RainfallRadioGroup (props) {
    const { classes, rainfallTriggerData, setRainfallTriggerData } = props;

    const {
        switchRainfall, rainfall, triggerTimestamp,
        techInfo, triggerR1, triggerR0,
        triggerRx
    } = rainfallTriggerData;


    const handleChange = (key, element_id) => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            if (element_id === "ts_R") setRainfallTriggerData({
                ...rainfallTriggerData,
                triggerTimestamp: value
            });
        } else {
            console.log("");
            if (element_id === "tech_info_R") setRainfallTriggerData({
                ...rainfallTriggerData,
                techInfo: value
            });
        }
    };

    const handleSwitchChange = event => {
        const is_checked = event.target.checked;

        setRainfallTriggerData(previous => ({ ...previous, switchRainfall: is_checked }));

        if (!is_checked) {
            setRainfallTriggerData(previous => ({ ...previous, rainfall: "" }));
        }
    };

    const handleRadioChange = event => {
        setRainfallTriggerData({ ...rainfallTriggerData, rainfall: event.target.value });
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchRainfall ? classes.groupGridContainer : ""}>
                <RadioGroup
                    label="Rainfall"
                    id="rainfall"
                    switchState={switchRainfall}
                    switchHandler={handleSwitchChange}
                    switchValue="switchRainfall"
                    radioValue={rainfall}
                    choices={[
                        { state: triggerR1, value: "triggerR1", label: "Release new trigger" },
                        { state: triggerR0, value: "triggerR0", label: "No data (R0)" },
                        { state: triggerRx, value: "triggerRx", label: "Intermediate threshold (rx)" }
                    ]}
                    changeHandler={handleRadioChange}
                />
            </Grid>

            {
                rainfall === "triggerR1" ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="R"
                        trigger_timestamp={triggerTimestamp}
                        tech_info={techInfo}
                        changeHandler={handleChange}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(RainfallRadioGroup);
