import React, { Fragment, useState } from "react";
import {
    Grid, TextField, Button,
    Divider, IconButton, Typography
} from "@material-ui/core";
import { DeleteForever as DeleteIcon } from "@material-ui/icons";
import Tooltip from "@material-ui/core/Tooltip";

import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

// Widgets
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

function MomsInputFields (props) {
    const {
        momsEntry: moms_entry,
        updateField: update_field,
        isAddingNewInstance: is_adding_new_instance,
        location, site_code
    } = props;

    const { moms, options } = moms_entry;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={6}>
                <SelectMultipleWithSuggest
                    label="Feature Type"
                    options={options.feature_type}
                    value={moms.feature_type}
                    changeHandler={update_field("feature_type")}
                    placeholder="Select feature type"
                    renderDropdownIndicator
                    openMenuOnClick
                />
            </Grid> 
            <Grid item xs={12} container spacing={1}>
                <Tooltip 
                    title="Feature names are auto-generated. To add new MOMs feature name, choose (Add new instance)"
                    placement="top"
                    interactive
                >
                    <Grid item xs={12} sm={6} md={6}>
                        <SelectMultipleWithSuggest
                            label="Feature Name"
                            options={options.feature_name.options}
                            isDisabled={options.feature_name.disabled}
                            value={moms.feature_name}
                            changeHandler={update_field("feature_name")}
                            placeholder={options.feature_name.disabled ? "Disabled" : "Select feature name"}
                            renderDropdownIndicator
                            openMenuOnClick
                        />
                    </Grid>
                </Tooltip>
                {
                    is_adding_new_instance && (
                        <Grid item xs={12} sm={6} md={6}>
                            <TextField
                                label="Location"
                                multiline
                                rowsMax="2"
                                placeholder="Enter location of new instance"
                                value={location}
                                onChange={update_field("location")}
                                fullWidth
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    )
                }
            </Grid>


            <Grid item xs={12} sm={6} md={6}>
                <SelectMultipleWithSuggest
                    label="Alert Level"
                    options={options.alert_level.options}
                    isDisabled={options.alert_level.disabled}
                    value={moms.alert_level}
                    changeHandler={update_field("alert_level")}
                    placeholder={options.alert_level.disabled ? "Disabled" : "Select alert level"}
                    renderDropdownIndicator
                    openMenuOnClick
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    label="Observance Timestamp"
                    value={moms.observance_ts}
                    onChange={update_field("observance_ts")}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask="__/__/__ __:__"
                    clearable
                    disableFuture
                    fullWidth
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
                <TextField
                    label="Narrative"
                    multiline
                    rowsMax="2"
                    placeholder="Enter report narrative"
                    value={moms.narrative}
                    onChange={update_field("narrative")}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
                {/* <SelectMultipleWithSuggest
                    label="Reporter"
                    options={options.reporter}
                    value={moms.reporter}
                    changeHandler={update_field("reporter")}
                    placeholder="Select reporter"
                    renderDropdownIndicator
                    openMenuOnClick
                /> */}
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="Reporter"
                    div_id="reporter"
                    changeHandler={update_field("reporter")}
                    value={moms.reporter}
                    isCommunityStaff="true"
                    site_code={site_code}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
                <TextField
                    label="Remarks"
                    multiline
                    rowsMax="2"
                    placeholder="Enter expert's remarks"
                    value={moms.remarks}
                    onChange={update_field("remarks")}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="Validator"
                    div_id="validator"
                    changeHandler={update_field("validator")}
                    value={moms.validator}
                />
            </Grid>
        </Grid>
    );
}

function MomsForm (props) {
    const {
        momsEntries, setMomsEntries,
        siteCode, site, setSite
    } = props;

    const [isAddingNewInstance, setIsAddingNewInstance] = useState(false);
    // const [site, setSite] = useState("");

    const addInstanceFn = () => setMomsEntries({ action: "ADD_INSTANCE" });
    const updateField = key => attribute => event => {
        const group_1 = ["feature_type", "feature_name", "alert_level", "observance_ts"];
        const group_2 = ["narrative", "remarks", "reporter", "validator", "location"];
        let value = "";

        if (attribute === "feature_name") {
            if (event.label === "(Add new instance)") setIsAddingNewInstance(true);
            else setIsAddingNewInstance(false);
        }
        if (group_1.includes(attribute)) {
            value = event;
        } else if (group_2.includes(attribute)) {
            value = event.target.value;
        }

        setMomsEntries({
            action: "UPDATE_DETAILS",
            key,
            attribute,
            value
        });
    };
    const deleteInstanceFn = key => () => setMomsEntries({ action: "DELETE_INSTANCE", key });

    return (
        <Fragment>
            {
                siteCode === null && (
                    <DynaslopeSiteSelectInputForm
                        value={site}
                        changeHandler={value => setSite(value)}
                    />
                )
            }

            {
                (site !== null || siteCode !== null) && (
                    <Fragment>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            {
                                momsEntries.map((entry, key) => {
                                    const is_first = key === 0;
                                    const is_last = momsEntries.length === key + 1;

                                    return (
                                        <Fragment key={key}>
                                            <div style={{ 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center",
                                                paddingBottom: is_first ? 12 : 0
                                            }}>
                                                <Typography variant="subtitle2">Entry Number {key + 1}</Typography>

                                                {
                                                    !is_first && (
                                                        <IconButton 
                                                            aria-label="delete" 
                                                            color="primary"
                                                            onClick={deleteInstanceFn(key)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )
                                                }
                                            </div>

                                            <MomsInputFields 
                                                momsEntry={entry}
                                                updateField={updateField(key)}
                                                isAddingNewInstance={isAddingNewInstance}
                                                site_code={siteCode}
                                            />

                                            {
                                                !is_last && (
                                                    <Divider
                                                        style={{ margin: "24px 0 12px" }}
                                                        variant="middle"
                                                    />
                                                )
                                            }
                                        </Fragment>
                                    );
                                })
                            }
                        </MuiPickersUtilsProvider>

                        <div style={{ margin: "16px 0" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={addInstanceFn}
                            >
                                Add MOMs Observation
                            </Button>
                        </div>
                    </Fragment>
                )
            }
        </Fragment>
    );
}

export default MomsForm;