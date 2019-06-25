import React, { useState, useEffect, Component, Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";
import CheckboxGroupWithSwitch from "../../reusables/CheckboxGroupWithSwitch";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";

const styles = theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
});

function SubsurfaceCheckboxGroup (props) {
    const { classes, subsurfaceTriggerData, setSubsurfaceTriggerData } = props;
    // console.log(subsurfaceTriggerData);

    const {
        switchSubsurface,
        triggerS2, triggerS3, triggerS0,
    } = subsurfaceTriggerData;


    const handleChange = key => x => {
        console.log("key", key);
        console.log(x);
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            setSubsurfaceTriggerData({ ...subsurfaceTriggerData, triggerTimestamp: value });
        } else {
            setSubsurfaceTriggerData({ ...subsurfaceTriggerData, techInfo: value });
        }
    };

    const handleSwitchChange = (event) => {
        console.log("Subs-Switch flicked with target: ", event.target);

        const is_checked = event.target.checked;
        setSubsurfaceTriggerData({ ...subsurfaceTriggerData, switchSubsurface: is_checked });

        if (!is_checked) {
            setSubsurfaceTriggerData({
                ...subsurfaceTriggerData,
                triggerS2: { status: false, disabled: false },
                triggerS3: { status: false, disabled: false },
                triggerS0: { status: false, disabled: false }
            });
        }
    };

    const handleCheckboxChange = name => event => {
        console.log("Subs-checkbox checked with target: ", event.target);

        const is_checked = event.target.checked;
        console.log(name);


        setSubsurfaceTriggerData(previous => {
            const temp = previous[name];
            const temp2 = {
                triggerS2: { status: false, disabled: is_checked },
                triggerS3: { status: false, disabled: is_checked }
            };

            console.log(is_checked, previous.triggerS2.status, previous.triggerS3.status);
            console.log(subsurfaceTriggerData);
            const is_s0_disabled = !is_checked ? previous.triggerS2.status && previous.triggerS3.status : is_checked;
            // const is_s0_disabled = is_checked;
            console.log(is_s0_disabled);

            const final = name === "triggerS0" ? { ...temp2 } : { triggerS0: { status: false, disabled: is_s0_disabled } };

            return ({ ...previous, [name]: { ...temp, status: is_checked }, ...final });
        });


    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchSubsurface ? classes.groupGridContainer : ""}>
                <CheckboxGroupWithSwitch
                    label="Subsurface"
                    switchState={switchSubsurface}
                    switchHandler={handleSwitchChange}
                    switchValue="switch_subsurface"
                    choices={[
                        { state: triggerS2, value: "triggerS2", label: "Release trigger (s2)" },
                        { state: triggerS3, value: "triggerS3", label: "Release trigger (S3)" },
                        { state: triggerS0, value: "triggerS0", label: "No data ([s/S]0)" }
                    ]}
                    changeHandler={handleCheckboxChange}
                />
            </Grid>
            {
                triggerS2.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="s2"
                        trigger_timestamp={triggerS2.triggerTimestamp}
                        tech_info={triggerS2.techInfo}
                        changeHandler={handleChange}
                    />
                ) : (
                    <div />
                )
            }

            {
                triggerS3.status ? (
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="S3"
                        trigger_timestamp={triggerS3.triggerTimestamp}
                        tech_info={triggerS3.techInfo}
                        changeHandler={handleChange}
                    />
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(SubsurfaceCheckboxGroup);
