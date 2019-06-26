import React, { useState, useEffect, Component, Fragment } from "react";
import { Grid, withStyles } from "@material-ui/core";
import { element } from "prop-types";
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


    const handleChange = (key, element_id) => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            if (element_id === "ts_s2") setSubsurfaceTriggerData({
                ...subsurfaceTriggerData,
                triggerS2: { ...triggerS2, triggerTimestamp: value }
            });
            else setSubsurfaceTriggerData({
                ...subsurfaceTriggerData,
                triggerS3: { ...triggerS3, triggerTimestamp: value }
            });
        } else {
            console.log("");
            if (element_id === "tech_info_s2") setSubsurfaceTriggerData({
                ...subsurfaceTriggerData,
                triggerS2: { ...triggerS2, techInfo: value }
            });
            else setSubsurfaceTriggerData({
                ...subsurfaceTriggerData,
                triggerS3: { ...triggerS3, techInfo: value }
            });
        }
    };

    const handleSwitchChange = event => {
        const is_checked = event.target.checked;

        setSubsurfaceTriggerData(previous => ({ ...previous, switchSubsurface: is_checked }));

        if (!is_checked) {
            setSubsurfaceTriggerData(previous => ({
                ...previous,
                triggerS2: { ...triggerS2, status: false, disabled: false },
                triggerS3: { ...triggerS3, status: false, disabled: false },
                triggerS0: { status: false, disabled: false }
            }));
        }
    };

    const handleCheckboxChange = name => event => {
        const is_checked = event.target.checked;

        setSubsurfaceTriggerData(previous => {
            const temp = previous[name];
            const temp2 = {
                triggerS2: { ...triggerS2, status: false, disabled: is_checked },
                triggerS3: { ...triggerS3, status: false, disabled: is_checked }
            };
            const is_s0_disabled = !is_checked ? previous.triggerS2.status && previous.triggerS3.status : is_checked;

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
                    switchValue="switchSubsurface"
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
