import React, {
    Fragment, useContext, useState
} from "react";

import {
    Grid, Typography, TextField, Checkbox
} from "@material-ui/core";
import {
    MuiPickersUtilsProvider, KeyboardDateTimePicker,
    KeyboardTimePicker
} from "@material-ui/pickers";

import Radio from "@material-ui/core/Radio";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";

import MomentUtils from "@date-io/moment";

import { Store } from "./store";
import Actions from "./actions";

import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";


function FirstStep (props) {
    const { state, dispatch } = useContext(Store);

    return (
        <Fragment>
            <Grid item xs={12} md={6}>
                <DynaslopeSiteSelectInputForm
                    value={state.site}
                    changeHandler={value => Actions.updateSite({ dispatch, payload: value })}
                    required
                />                
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    fullWidth
                    label="Data Timestamp"
                    value={state.data_ts}
                    onChange={e => Actions.updateDataTS({ dispatch, payload: e })}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask="____/__/__ __:__"
                    clearable
                    disableFuture
                    helperText={state.validation.data_ts || ""}
                    error={Boolean(state.validation.data_ts)}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
                <KeyboardTimePicker
                    required
                    autoOk
                    fullWidth
                    ampm={false}
                    label="Time of Release"
                    mask="__:__"
                    placeholder="00:00"
                    value={state.release_time}
                    onChange={e => Actions.updateReleaseTime({ dispatch, payload: e })}
                    clearable
                    helperText={state.validation.release_time || ""}
                    error={Boolean(state.validation.release_time)}
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="MT Personnel"
                    div_id="reporter_id_mt"
                    value={state.iomp_mt}
                    disabled
                    required
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="CT Personnel"
                    div_id="reporter_id_ct"
                    value={state.iomp_ct}
                    // changeHandler={e => Actions.updateReleaseTime({ dispatch, payload: e.target.value })}}
                    required
                />
            </Grid>
        </Fragment>
    );
}

function SecondStep (props) {

    return (
        <Fragment>
            <SubsurfaceSection />
            <SurficialSection/>
            <RainfallSection />
            <EarthquakeSection />
        </Fragment>
    );
}

function DataPresenceRadioInput (props) {
    const { form, value, changeHandler } = props;

    return (
        <FormControl component="fieldset" style={{ width: "100%" }}>
            <FormLabel component="legend">Choose the appropriate data situation for the release period.</FormLabel>
            <Grid container>
                {
                    form.map(x => (
                        <Grid item xs={12} sm={6} key={x.value}>
                            <FormControlLabel
                                value={x.value} label={x.label}
                                control={<Radio 
                                    checked={value === x.value}
                                    onChange={changeHandler}
                                />}
                            />
                        </Grid>
                    ))
                }
            </Grid>
        </FormControl>
    );
}

function TriggerTimestampAndTechInfoCombo (props) {
    const {
        triggerHandler, labelFor, trigger
    } = props;

    return (
        <Fragment>
            <Grid item xs={12} sm={6}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    label={`Trigger Timestamp (${labelFor})`}
                    value={trigger.ts}
                    onChange={e => triggerHandler("ts", e)}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask="____/__/__ __:__"
                    clearable
                    disableFuture
                    fullWidth
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    required
                    label={`Technical Information (${labelFor})`}
                    multiline
                    rowsMax="2"
                    placeholder={`Enter technical info for "${labelFor}" trigger`}
                    value={trigger.tech_info}
                    onChange={e => triggerHandler("tech_info", e.target.value)}
                    fullWidth
                />
            </Grid>
        </Fragment>
    );
}

function SubsurfaceSection (props) {
    const { state, dispatch } = useContext(Store);
    const { subsurface: { value, triggers } } = state;

    const form = [
        { value: "1", label: "ABOVE threshold at a certain time" },
        { value: "0", label: "BELOW threshold all throughout" },
        { value: "-1", label: "No data all throughout" }
    ];

    const valueChangeHandler = e => {
        const temp = e.target.value;
        Actions.updateSubsurfacePresence({ dispatch, payload: temp });
    };

    const triggersCboxHandler = alert_level => e => {
        Actions.updateSubsurfaceTrigger({ dispatch, payload: {
            value: e.target.checked, key: alert_level 
        } });
    };

    const triggerDetailsHandler = alert_level => (attr, val) => {
        Actions.updateSubsurfaceTriggerDetails({ dispatch, payload: {
            value: val, key: alert_level, attr
        } });
    };

    const TriggersComponents = Object.keys(triggers).map(x => {
        const alert_level = parseInt(x, 10);
        const trigger = triggers[x];
        const { checked } = trigger;
        const key = `s${alert_level}`;

        return <Grid item xs={checked ? 12 : 6} container key={key}>
            <Grid item xs={checked ? 4 : 6} sm={checked ? 3 : 6} justify="center" container>
                <FormControlLabel
                    value={alert_level}
                    control={<Checkbox 
                        color="primary"
                        checked={checked}
                        onClick={triggersCboxHandler(alert_level)}
                    />}
                    label={`Trigger ${key}`}
                />
            </Grid>

            {
                checked && <Grid item xs={8} sm={9} container justify="space-evenly"
                    alignItems="center"
                    spacing={2}
                >
                    <TriggerTimestampAndTechInfoCombo
                        labelFor={key}
                        trigger={trigger}
                        triggerHandler={triggerDetailsHandler(alert_level)}
                    />
                </Grid>
            }
        </Grid>;
    });

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">Subsurface</Typography>
            </Grid>

            <Grid item xs={12}>
                <DataPresenceRadioInput form={form} value={value} changeHandler={valueChangeHandler} />
            </Grid>

            {
                value === "1" && <Grid item xs={12} container spacing={1}>
                    { TriggersComponents }
                </Grid>
            }
        </Fragment>
    );
}

function SurficialSection (props) {
    const { state, dispatch } = useContext(Store);
    const { surficial: { value, triggers } } = state;

    const form = [
        { value: "1", label: "ABOVE threshold at a certain time" },
        { value: "0", label: "BELOW threshold all throughout" },
        { value: "-1", label: "No data all throughout" }
    ];

    const valueChangeHandler = e => {
        const temp = e.target.value;
        Actions.updateSurficialPresence({ dispatch, payload: temp });
    };

    const triggersCboxHandler = alert_level => e => {
        Actions.updateSurficialTrigger({ dispatch, payload: {
            value: e.target.checked, key: alert_level 
        } });
    };

    const triggerDetailsHandler = alert_level => (attr, val) => {
        Actions.updateSurficialTriggerDetails({ dispatch, payload: {
            value: val, key: alert_level, attr
        } });
    };

    const TriggersComponents = Object.keys(triggers).map(x => {
        const alert_level = parseInt(x, 10);
        const trigger = triggers[x];
        const { checked } = trigger;
        const key = `g${alert_level}`;

        return <Grid item xs={checked ? 12 : 6} container key={key}>
            <Grid item xs={checked ? 4 : 6} sm={checked ? 3 : 6} justify="center" container>
                <FormControlLabel
                    value={alert_level}
                    control={<Checkbox 
                        color="primary"
                        checked={checked}
                        onClick={triggersCboxHandler(alert_level)}
                    />}
                    label={`Trigger ${key}`}
                />
            </Grid>

            {
                checked && <Grid item xs={8} sm={9} container justify="space-evenly"
                    alignItems="center"
                    spacing={2}
                >
                    <TriggerTimestampAndTechInfoCombo
                        labelFor={key}
                        trigger={trigger}
                        triggerHandler={triggerDetailsHandler(alert_level)}
                    />
                </Grid>
            }
        </Grid>;
    });

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">Surficial</Typography>
            </Grid>

            <Grid item xs={12}>
                <DataPresenceRadioInput form={form} value={value} changeHandler={valueChangeHandler} />
            </Grid>

            {
                value === "1" && <Grid item xs={12} container spacing={1}>
                    { TriggersComponents }
                </Grid>
            }
        </Fragment>
    );
}

function RainfallSection (props) {
    const { state, dispatch } = useContext(Store);
    const { rainfall: { value, trigger } } = state;

    const form = [
        { value: "1", label: "ABOVE threshold at a certain time" },
        { value: "0", label: "BELOW threshold all throughout" },
        { value: "-2", label: "Currently BELOW threshold BUT above 75%" },
        { value: "-1", label: "No data all throughout" }
    ];

    const valueChangeHandler = e => {
        const temp = e.target.value;
        Actions.updateRainfallPresence({ dispatch, payload: temp });
    };

    const triggerDetailsHandler = (attr, val) => {
        Actions.updateRainfallTriggerDetails({ dispatch, payload: {
            value: val, attr
        } });
    };

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">Rainfall</Typography>
            </Grid>

            <Grid item xs={12}>
                <DataPresenceRadioInput form={form} value={value} changeHandler={valueChangeHandler} />
            </Grid>

            {
                value === "1" && <TriggerTimestampAndTechInfoCombo
                    labelFor="r1"
                    trigger={trigger}
                    triggerHandler={triggerDetailsHandler}
                />
            }
        </Fragment>
    );
}

function EarthquakeSection (props) {
    const form = [
        { value: "1", label: "Recent trigger occured" },
        { value: "0", label: "No recent trigger" }
    ];

    const [value, setValue] = useState("");
    const changeHandler = e => setValue(e.target.value);

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">Earthquake</Typography>
            </Grid>

            <Grid item xs={12}>
                <DataPresenceRadioInput form={form} value={value} changeHandler={changeHandler} />
            </Grid>
        </Fragment>
    );
}

function ThirdStep (props) {
    const { state } = useContext(Store);

    const preview = [
        { label: "Site", value: "Sample Site" },
        { label: "Internal Alert", value: "A2-sg" },
        { label: "Data Timestamp", value: "xxxx-xx-xx xx:xx" },
        { label: "Release Time", value: "xx:xx" },
        { label: "MT Personnel", value: "Juan dela Cruz" }
    ];
    
    const PreviewComp = x => (
        <Grid item xs={6} key={x.label}>
            <Typography variant="body2" color="textSecondary" align="center">{x.label}</Typography>
            <Typography variant="body1" color="textPrimary" align="center">
                {x.value}
            </Typography>
        </Grid>
    );

    return (
        <Fragment>
            {
                preview.map(x => {
                    return PreviewComp(x);
                })
            }
            
            <Grid item xs={12} sm={6}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="CT Personnel"
                    div_id="reporter_id_ct"
                    value={state.iomp_ct}
                    // changeHandler={e => Actions.updateReleaseTime({ dispatch, payload: e.target.value })}}
                    required
                />
            </Grid>

            <Grid item xs={12}>
                <TextField
                    label="Comments"
                    multiline
                    rowsMax="2"
                    placeholder="Enter additional comments necessary"
                    // value={comments}
                    // onChange={handleEventChange("comments")}
                    fullWidth
                />
            </Grid>
        </Fragment>
    );
}

function AlertReleaseForm (props) {
    const { activeStep } = props;

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={2}
            >
                {
                    activeStep === 0 && <FirstStep />
                }
                {
                    activeStep === 1 && <SecondStep />
                }
                {
                    activeStep === 2 && <ThirdStep />
                }
            </Grid>
        </MuiPickersUtilsProvider>
    );
}

export default AlertReleaseForm;