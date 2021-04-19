import React, { Fragment, useState } from "react";
import {
    Grid, TextField,
    Radio, FormControl, FormLabel,
    RadioGroup, FormControlLabel, CircularProgress
} from "@material-ui/core";

import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

// Widgets
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

function OnDemandForm (props) {
    const {
        selectSite, site, setSite,
        alertLevel, setAlertLevel,
        requestTs, setRequestTs,
        reason, setReason,
        reporter, setReporter,
        techInfo, setTechInfo,
        loading, hasOnDemand
    } = props;

    const initial_label = { label: "Reason", holder: "Enter reason (will appear on timeline)" };
    const [reason_label, setReasonLabel] = useState(initial_label);
    const handleChange = event => {
        const { value } = event.target;
        setAlertLevel(value);
        let label = initial_label;
        if (value === "0") {
            label = { label: "Remarks", holder: "Enter remarks (will appear on timeline)" };
            setTechInfo("");
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
                loading && <Grid container justify="center"><CircularProgress /></Grid>
            }

            {
                site !== null && !loading && (
                    <Fragment>
                        <FormControl component="fieldset" style={{ display: "flex", marginTop: 16 }}>
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
                                    value="1"
                                    control={<Radio color="primary"/>}
                                    label="Raise/Extend (d1)"
                                    key="d1"
                                />

                                {
                                    hasOnDemand && <FormControlLabel
                                        value="0"
                                        control={<Radio color="primary"/>}
                                        label="Lower/End (d)"
                                        key="d"
                                    />
                                }
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
                                alertLevel === "1" && (
                                    <Grid item xs={12} sm={6} md={6}>
                                        <TextField
                                            label="Technical Information"
                                            multiline
                                            rowsMax="2"
                                            placeholder="This will appear on the EWI bulletin"
                                            value={techInfo}
                                            onChange={event => setTechInfo(event.target.value)}
                                            fullWidth
                                            required
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
                                    required
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