import React, { useState, Component, Fragment } from "react";
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
    const { classes, currentSwitchState } = props;
    console.log(currentSwitchState);
    const [techInfo, setTechInfo] = useState("");
    const [switchSubsurface, setSwitchSubsurface] = useState(currentSwitchState);
    const [triggerS2, setTriggerS2] = useState({ triggerS2Status: false, triggerS2Disabled: false });
    const [triggerS3, setTriggerS3] = useState({ triggerS3Status: false, triggerS3Disabled: false });
    const [triggerS0, setTriggerS0] = useState({ triggerS0Status: false, triggerS0Disabled: false });

    const trigger_s = {
        triggerS1Status, triggerS1Disabled
    };
    const trigger_S = {
        triggerS2Status, triggerS2Disabled
    };
    const trigger_s0 = {
        triggerS0Status, triggerS0Disabled
    };

    function handleSwitchChange (event) {
        console.log("Subs-Switch flicked with target: ", event.target);

        const is_checked = event.target.checked;
        setSwitchSubsurface(is_checked);

        // if (!is_checked) {
        //     setTriggerS1Status(false);
        //     setTriggerS1Disabled(false);
        //     setTriggerS2Status(false);
        //     setTriggerS2Disabled(false);
        //     setTriggerS0Status(false);
        //     setTriggerS0Disabled(false);
        // }

        // #########################################
        // const temp = { ...this.state };
        // const is_checked = event.target.checked;
        // temp.switch_subsurface = is_checked;

        // if (!is_checked) {
        //     ["trigger_s", "trigger_S", "trigger_s0"].forEach(e => {
        //         temp[e].status = false;
        //         temp[e].disabled = false;
        //     });
        // }
        // this.setState(temp);
    }

    function handleCheckboxChange (event) {
        console.log("Subs-checkbox checked with target: ", event.target);
    }

    return (
        <Fragment>
            <Grid item xs={12} className={switchSubsurface ? classes.groupGridContainer : ""}>
                <CheckboxGroupWithSwitch
                    label="Subsurface"
                    switchState={switchSubsurface}
                    switchHandler={handleSwitchChange}
                    switchValue="switch_subsurface"
                    choices={[
                        { state: trigger_s, value: "trigger_s", label: "Release trigger (s2)" },
                        { state: trigger_S, value: "trigger_S", label: "Release trigger (S3)" },
                        { state: trigger_s0, value: "trigger_s0", label: "No data ([s/S]0)" }
                    ]}
                    changeHandler={handleCheckboxChange}
                />
            </Grid>
        </Fragment>
    );
}

export default withStyles(styles)(SubsurfaceCheckboxGroup);
