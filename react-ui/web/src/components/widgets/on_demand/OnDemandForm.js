import React, { Fragment, useState } from "react";
import {
    Grid, TextField, Button,
    Divider, IconButton, Typography,
    Radio, FormControl, FormLabel,
    RadioGroup, FormControlLabel
} from "@material-ui/core";
import { DeleteForever as DeleteIcon } from "@material-ui/icons";
import Tooltip from "@material-ui/core/Tooltip";

import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

// Widgets
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { initial } from "lodash";

function OnDemandForm (props) {
    const {
        selectSite, site, setSite,
        alertLevel, setAlertLevel,
        requestTs, setRequestTs,
        reason, setReason,
        reporter, setReporter,
        techInfo, setTechInfo
    } = props;

    const initial_label = {label: "Reason", holder: "Enter reason"};
    const [reason_label, setReasonLabel] = useState(initial_label);
    const handleChange = event => {
        const value = event.target.value
        console.log(value)
        setAlertLevel(value);
        let label = initial_label;
        if (value === "0") {
            label = {label: "Narrative", holder: "Enter narrative"};
            setTechInfo("")
        }
        setReasonLabel(label);
    };

    return (
        <Fragment>
            {
                selectSite && (
                    <div style={{ marginBottom: 12 }}>
                        <DynaslopeSiteSelectInputForm
                            value={site}
                            changeHandler={value => setSite(value)}
                        />
                    </div>
                )
            }

            {
                site !== null && (
                    <Fragment>
                        <FormControl component="fieldset" style={{ display: "flex" }}>
                            <FormLabel component="legend" style={{ textAlign: "center", marginBottom: 8 }}>
                                Choose alert level
                            </FormLabel>

                            <RadioGroup 
                                aria-label="choose_alert_level"
                                name="choose_alert_level"
                                value={alertLevel}
                                onChange={handleChange}
                                row
                                style={{ justifyContent: "space-around" }}
                            >
                                <FormControlLabel
                                    value={"1"}
                                    control={<Radio color="primary"/>}
                                    label="Raise"
                                    key="d1"
                                />
                                <FormControlLabel
                                    value={"-2"}
                                    control={<Radio color="primary"/>}
                                    label="Extend"
                                    key="dx"
                                />
                                <FormControlLabel
                                    value={"0"}
                                    control={<Radio color="primary"/>}
                                    label="Lower"
                                    key="d0"
                                />
                            </RadioGroup>
                        </FormControl>
                        <Grid container spacing={1}>
                            <Grid item xs={12} sm={6} md={6}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Timestamp"
                                        value={requestTs}
                                        onChange={val => setRequestTs(val)}
                                        ampm={false}
                                        placeholder="2010/01/01 00:00"
                                        format="YYYY/MM/DD HH:mm"
                                        mask="____/__/__ __:__"
                                        clearable
                                        disableFuture
                                        fullWidth
                                    />
                                </MuiPickersUtilsProvider>
                            </Grid>
                            {
                                alertLevel == "1" && (
                                    <Grid item xs={12} sm={6} md={6}>
                                        <TextField
                                            label="Technical Information"
                                            multiline
                                            rowsMax="2"
                                            placeholder="Enter technical information"
                                            value={techInfo}
                                            onChange={event => setTechInfo(event.target.value)}
                                            fullWidth
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>
                                )
                            }
                            
                            <Grid item xs={12} sm={6} md={6}>
                                <TextField
                                    label={reason_label.label}
                                    multiline
                                    rowsMax="2"
                                    placeholder={reason_label.holder}
                                    value={reason}
                                    onChange={event => setReason(event.target.value)}
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <DynaslopeUserSelectInputForm
                                    variant="standard"
                                    label="Reporter"
                                    div_id="reporter"
                                    changeHandler={event => setReporter(event.target.value)}
                                    value={reporter}
                                    isCommunityStaff="true"
                                    site_code={site.data.site_code}
                                />
                            </Grid>
                        </Grid>
                    </Fragment>
                )
            }
            
        </Fragment>
    );
}

export default OnDemandForm;