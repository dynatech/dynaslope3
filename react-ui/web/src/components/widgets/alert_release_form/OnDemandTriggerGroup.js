import React, { Component, Fragment } from "react";
import {
    Grid, withStyles, FormControl,
    FormLabel, Switch, TextField
} from "@material-ui/core";

import { handleChange, handleEventChange, handleSwitchChange } from "./state_handlers";
import TriggerTimestampAndTechInfoCombo from "./TriggerTimestampAndTechInfoCombo";
import SelectInputForm from "../../reusables/SelectInputForm";

const community_contacts = [{ user_id: 1, name: "MLGU Something" }, { user_id: 2, name: "LEWC Chenes" }, { user_id: 3, name: "BLGU Chos" }];

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
    },
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 0
    },
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    }
});


function OnDemandTriggerGroup (props) {
    const {
        classes, triggersState, setTriggersState
    } = props;

    const { on_demand } = triggersState;
    const { switchState, triggers } = on_demand;

    let timestamp, tech_info, reason, reporterId;
    if (triggers.length !== 0) {
        const { timestamp, tech_info, reason, reporterId } = triggers[0]; // There is always only ONE on demand trigger
    }

    // let triggers_value = { reason: "", reporterId: "" };
    // if (triggers.length !== 0) {
    //     triggers.forEach(trigger => {
    //         triggers_value = { ...triggers_value, ...trigger };
    //     });
    // }

    console.log("<triggersState>", triggersState);

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" className={classes.formLabel}>
                        <span>On Demand</span>

                        <Switch
                            checked={switchState}
                            onChange={handleSwitchChange(setTriggersState, "on_demand")}
                            value="switch_on_demand"
                        />
                    </FormLabel>
                </FormControl>
            </Grid>

            {
                switchState ? (
                    <Fragment>
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="d1"
                            trigger_timestamp={timestamp}
                            tech_info={tech_info}
                            changeHandler={handleChange(setTriggersState, "on_demand")}
                        />

                        <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="reason"
                                label="Reason"
                                value={reason}
                                onChange={handleEventChange("reason", setTriggersState, "on_demand")}
                                placeholder="Enter reason of on-demand request"
                                multiline
                                rowsMax={2}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                            <SelectInputForm
                                label="Reporter"
                                div_id="reporter_id"
                                changeHandler={handleEventChange("reporterId", setTriggersState, "on_demand")}
                                value={reporterId}
                                list={community_contacts}
                                mapping={{ id: "user_id", label: "name" }}
                            />
                        </Grid>

                    </Fragment>
                ) : (
                    <div />
                )
            }
        </Fragment>
    );
}

export default withStyles(styles)(OnDemandTriggerGroup);
