import React, { Component, Fragment } from "react";
import {
    Grid, withStyles, FormControl,
    FormLabel, Switch, TextField
} from "@material-ui/core";
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
    const { classes, onDemandTriggerData, setOnDemandTriggerData } = props;

    const {
        switchOnDemand, triggerTimestamp,
        techInfo, reason, reporterId
    } = onDemandTriggerData;

    const handleChange = (key, element_id) => x => {
        const value = key === "trigger_timestamp" ? x : x.target.value;

        if (key === "trigger_timestamp") {
            if (element_id === "ts_d1") setOnDemandTriggerData({
                ...onDemandTriggerData,
                triggerTimestamp: value
            });
        } else {
            console.log("");
            if (element_id === "tech_info_d1") setOnDemandTriggerData({
                ...onDemandTriggerData,
                techInfo: value
            });
        }
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        setOnDemandTriggerData({
            ...onDemandTriggerData, [key]: value
        });
    };

    const handleSwitchChange = event => {
        const is_checked = event.target.checked;

        setOnDemandTriggerData(previous => ({ ...previous, switchOnDemand: is_checked }));
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchOnDemand ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" className={classes.formLabel}>
                        <span>On Demand</span>

                        <Switch
                            checked={switchOnDemand}
                            onChange={handleSwitchChange}
                            value="switch_on_demand"
                        />
                    </FormLabel>
                </FormControl>
            </Grid>

            {
                switchOnDemand ? (
                    <Fragment>
                        <TriggerTimestampAndTechInfoCombo
                            labelFor="d1"
                            trigger_timestamp={triggerTimestamp}
                            tech_info={techInfo}
                            changeHandler={handleChange}
                        />

                        <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                            <TextField
                                required
                                id="reason"
                                label="Reason"
                                value={reason}
                                onChange={handleEventChange("reason")}
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
                                changeHandler={handleEventChange("reporterId")}
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
