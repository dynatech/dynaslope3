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

function SurficialCheckboxGroup (props) {
    const { classes, surficialTriggerData, setSurficialTriggerData } = props;

    const {
        switchSurficial,
        triggerG2, triggerG3, triggerG0
    } = surficialTriggerData;


    const handleChange = (key, element_id) => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            if (element_id === "ts_g2") setSurficialTriggerData({
                ...surficialTriggerData,
                triggerG2: { ...triggerG2, triggerTimestamp: value }
            });
            else setSurficialTriggerData({
                ...surficialTriggerData,
                triggerG3: { ...triggerG3, triggerTimestamp: value }
            });
        } else {
            console.log("");
            if (element_id === "tech_info_g2") setSurficialTriggerData({
                ...surficialTriggerData,
                triggerG2: { ...triggerG2, techInfo: value }
            });
            else setSurficialTriggerData({
                ...surficialTriggerData,
                triggerG3: { ...triggerG3, techInfo: value }
            });
        }

    };

    const handleSwitchChange = event => {
        const is_checked = event.target.checked;

        setSurficialTriggerData(previous => ({ ...previous, switchSurficial: is_checked }));

        if (!is_checked) {
            setSurficialTriggerData(previous => ({
                ...previous,
                triggerG2: { ...triggerG2, status: false, disabled: false },
                triggerG3: { ...triggerG3, status: false, disabled: false },
                triggerG0: { status: false, disabled: false }
            }));
        }
    };

    const handleCheckboxChange = name => event => {
        const is_checked = event.target.checked;

        setSurficialTriggerData(previous => {
            const temp = previous[name];
            const temp2 = {
                triggerG2: { ...triggerG2, status: false, disabled: is_checked },
                triggerG3: { ...triggerG3, status: false, disabled: is_checked }
            };
            const is_g0_disabled = !is_checked ? previous.triggerG2.status && previous.triggerG3.status : is_checked;

            const final = name === "triggerG0" ? { ...temp2 } : { triggerG0: { status: false, disabled: is_g0_disabled } };

            return ({ ...previous, [name]: { ...temp, status: is_checked }, ...final });
        });
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchSurficial ? classes.groupGridContainer : ""}>
                <CheckboxGroupWithSwitch
                    label="Surficial"
                    switchState={switchSurficial}
                    switchHandler={handleSwitchChange}
                    switchValue="switchSurficial"
                    choices={[
                        { state: triggerG2, value: "triggerG2", label: "Release trigger (g2)" },
                        { state: triggerG3, value: "triggerG3", label: "Release trigger (G3)" },
                        { state: triggerG0, value: "triggerG0", label: "No data ([g/G]0)" }
                    ]}
                    changeHandler={handleCheckboxChange}
                />
            </Grid>

            {
                triggerG2.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="g2"
                        trigger_timestamp={triggerG2.triggerTimestamp}
                        tech_info={triggerG2.techInfo}
                        changeHandler={handleChange}
                    />
                ) : (
                    <div />
                )
            }

            {
                triggerG3.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="G3"
                        trigger_timestamp={triggerG3.triggerTimestamp}
                        tech_info={triggerG3.techInfo}
                        changeHandler={handleChange}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(SurficialCheckboxGroup);
