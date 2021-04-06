import React, {
    Fragment, useContext
} from "react";

import {
    Grid, Typography, TextField, Checkbox,
    CircularProgress, Divider, capitalize,
    FormControlLabel, Switch, FormControl,
    FormLabel, Radio
} from "@material-ui/core";
import {
    MuiPickersUtilsProvider, KeyboardDateTimePicker,
    KeyboardTimePicker
} from "@material-ui/pickers";

import MomentUtils from "@date-io/moment";
import moment from "moment";

import { Store } from "./store";
import Actions from "./actions";

import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";


function LoadingComponent (props) {
    const { message } = props;

    return <Fragment>
        <Grid item xs={12} container justify="center">
            <CircularProgress />
        </Grid>

        <Grid item xs={12}>
            <Typography variant="body1" align="center">
                { message }
            </Typography>
        </Grid>
    </Fragment>; 
}

function FirstStep (props) {
    const { state, dispatch } = useContext(Store);

    return (
        <Fragment>
            <Grid item xs={12} md={6}>
                <DynaslopeSiteSelectInputForm
                    value={state.site}
                    changeHandler={value => Actions.updateSite({ dispatch, payload: value })}
                    required
                    helperText={state.validation.site || ""}
                    error={Boolean(state.validation.site)}
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
                    changeHandler={e => Actions.updateCTPersonnel({ dispatch, payload: e.target.value })}
                    required
                    helperText={state.validation.iomp_ct || ""}
                    error={Boolean(state.validation.iomp_ct)}
                />
            </Grid>
        </Fragment>
    );
}

function SecondStep (props) {
    const { isLoading } = props;

    return <Fragment>
        {
            isLoading
                ? <LoadingComponent message="Fetching current site alert..." /> 
                : <Fragment>
                    <LatestSiteDetailsSection />
                    <SubsurfaceSection />
                    <SurficialSection/>
                    <RainfallSection />
                    <EarthquakeSection />
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                    <MOMsSection />
                    <OnDemandSection />
                </Fragment>
        }
    </Fragment>;
}

function LatestSiteDetailsSection (props) {
    const { state } = useContext(Store);
    const { previous_release } = state;
    const { internal_alert, event_alert, data_ts } = previous_release;
    const { alert_level } = event_alert.public_alert_symbol;

    let warning_text = null;
    if (moment(data_ts).isAfter(state.data_ts)) {
        warning_text = `You entered a data timestamp (${state.data_ts.format("YYYY/MM/DD HH:mm")}) ` +
        "that is prior to the last site alert release.\nReview your data timestamp entry.";
    } else if (moment(data_ts).isSame(state.data_ts)) {
        warning_text = "Note: You entered the same data timestamp from the last site alert release. " +
        "Ignore this note if you want to overwrite the last alert release.";
    }

    return <Fragment>
        <Grid item xs={12} container spacing={1}>
            <Typography variant="h6" component={Grid} item xs={12} align="center">
                Last Site Release Details: { event_alert.event.site.site_code.toUpperCase() }
            </Typography>

            <Grid item xs={12} container spacing={0} justify="center">
                <Typography 
                    variant="body1" component={Grid}
                    item xs={12} sm={6} align="center"
                >
                    <strong>Internal Alert:</strong> {internal_alert}
                </Typography>

                <Typography 
                    variant="body1" component={Grid}
                    item xs={12} sm={6} align="center"
                >
                    <strong>Data Timestamp:</strong> {data_ts}
                </Typography>

                { alert_level !== 0 && <Typography 
                    variant="body1" component={Grid}
                    item xs={12} sm={6} align="center"
                >
                    <strong>Validity:</strong> {event_alert.event.validity}
                </Typography> }

                <Typography 
                    variant="body1" component={Grid}
                    item xs={12} sm={6} align="center"
                >
                    <strong>Release Time:</strong> {previous_release.release_time}
                </Typography>
            </Grid>
        </Grid>

        { warning_text && <Grid item xs={12}>
            <Typography
                variant="body1" component="p" color="error"
                align="center" style={{ whiteSpace: "pre-line" }}
                display="block"
            >
                { warning_text }
            </Typography>
        </Grid>}

        <Grid item xs={12}>
            <Divider />
        </Grid>
    </Fragment>;
}

function DataPresenceRadioInput (props) {
    const { form, value, changeHandler } = props;

    return (
        <FormControl component="fieldset" style={{ width: "100%" }}>
            <FormLabel component="legend">Choose the appropriate data situation for the release period.</FormLabel>
            <Grid container spacing={0}>
                {
                    form.map(x => (
                        <Grid item xs={12} sm={6} key={x.value} container justify="center">
                            <FormControlLabel
                                value={x.value} label={x.label}
                                control={<Radio 
                                    checked={value === x.value}
                                    onChange={changeHandler}
                                    size="small"
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
        { value: "1", label: "ABOVE threshold at a certain time (s2/s3)" },
        { value: "0", label: "BELOW threshold all throughout (s)" },
        { value: "-1", label: "No data all throughout (s0)" }
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

        return <Grid item xs={12} container key={key}>
            <Grid item xs={checked ? 4 : 12} sm={checked ? 3 : 12} justify="center" container>
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
                <Typography variant="h6">Subsurface (S/s)</Typography>
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
        { value: "1", label: "ABOVE threshold at a certain time (g2/g3)" },
        { value: "0", label: "BELOW threshold all throughout (g)" },
        { value: "-1", label: "No data all throughout (g0)" }
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

        return <Grid item xs={12} container key={key}>
            <Grid item xs={checked ? 4 : 12} sm={checked ? 3 : 12} justify="center" container>
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
                <Typography variant="h6">Surficial (G/g)</Typography>
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

function MOMsSection (props) {
    const { state } = useContext(Store);
    const {
        moms: { value, triggers },
        non_triggering_moms
    } = state;

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">MOMS (M/m)</Typography>
                <Typography variant="caption">
                    Note: MOMs triggers are inserted via MOMs Form.
                    If you inserted a MOMs trigger for this site, wait for the trigger
                    to be included on the site&apos;s candidate alert then release it.
                </Typography>
            </Grid>

            {
                value === "1" && <Fragment> {
                    Object.keys(triggers).map(key => {
                        const { checked, ts, tech_info, moms_list } = triggers[key];
                        const preview = [
                            { label: "Alert", value: `m${key}` },
                            { label: "Trigger Timestamp", value: moment(ts).format("YYYY-MM-DD HH:mm") },
                            { label: "Technical Information", value: tech_info }
                        ];
                            
                        if (checked) {
                            const initial = preview.map(x => <Grid item xs={12} 
                                sm={x.label === "Technical Information" ? 6 : 3 }
                                key={x.label}>
                                { PreviewComp(x) }
                            </Grid>);

                            const intro = <Typography
                                variant="body2" align="center"
                                component={Grid} item xs={12}
                            >
                                <strong>MOMs List</strong>
                            </Typography>;

                            const list = MomsListFormatter(moms_list);

                            return <Fragment key={key}>{initial}{intro}{list}</Fragment>;
                        }
                    })
                } </Fragment>
            }

            {
                value === "0" && <Typography
                    variant="body1" align="center"
                    component={Grid} item xs={12}
                >
                    This release HAS non-triggering MOMs data within release period (m).
                </Typography>
            }

            {
                non_triggering_moms && <Fragment>
                    <Typography
                        variant="body2" align="center"
                        component={Grid} item xs={12}
                    >
                        <strong>Non-triggering MOMs</strong>
                    </Typography>

                    { MomsListFormatter(non_triggering_moms) }
                </Fragment>
            }

            {
                value === "-1" && <Typography
                    variant="body1" align="center"
                    component={Grid} item xs={12}
                >
                    No MOMs entry present for this release period (m0).
                </Typography>
            }
        </Fragment>
    );
}

function MomsListFormatter (moms_list) {
    return moms_list.map(x => {
        const {
            moms_instance: { feature: f, feature_name },
            remarks, observance_ts
        } = x;
        const temp = { label: "Feature", value: `${capitalize(f.feature_type)} ${feature_name}` };
        const ts_comp = { label: "Observance Timestamp", value: observance_ts };
        const rem = { label: "Remarks", value: remarks };

        return <Grid item xs={12} key={x.moms_id}>
            <Grid container item xs={12}>
                <Grid item xs={3}>{ PreviewComp(temp) }</Grid>
                <Grid item xs={3}>{ PreviewComp(ts_comp) }</Grid>
                <Grid item xs={6}>{ PreviewComp(rem) }</Grid>
            </Grid>
        </Grid>; 
    });
}

function RainfallSection (props) {
    const { state, dispatch } = useContext(Store);
    const { rainfall: { value, trigger } } = state;

    const form = [
        { value: "1", label: "ABOVE threshold at a certain time (r1)" },
        { value: "0", label: "BELOW threshold all throughout (r)" },
        { value: "-2", label: "Currently BELOW threshold BUT above 75% (rx)" },
        { value: "-1", label: "No data all throughout (r0)" }
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
                <Typography variant="h6">Rainfall (R)</Typography>
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
    const { state, dispatch } = useContext(Store);
    const { earthquake: { value, trigger } } = state;
    const { magnitude, latitude, longitude } = trigger;

    const form = [
        { value: "1", label: "Recent trigger occured" },
        { value: "0", label: "No recent trigger" }
    ];

    const valueChangeHandler = e => {
        const temp = e.target.value;
        Actions.updateEarthquakePresence({ dispatch, payload: temp });
    };

    const triggerDetailsHandler = (attr, val) => {
        Actions.updateEarthquakeTriggerDetails({ dispatch, payload: {
            value: val, attr
        } });
    };

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">Earthquake (E)</Typography>
            </Grid>

            <Grid item xs={12}>
                <DataPresenceRadioInput form={form} value={value} changeHandler={valueChangeHandler} />
            </Grid>

            {
                value === "1" && <Fragment>
                    <TriggerTimestampAndTechInfoCombo
                        labelFor="e1"
                        trigger={trigger}
                        triggerHandler={triggerDetailsHandler}
                    />
                    
                    <Grid item xs={12} sm={4}>
                        <TextField
                            required
                            id="magnitude"
                            label="Magnitude"
                            value={magnitude}
                            onChange={e => triggerDetailsHandler("magnitude", e.target.value)}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            required
                            id="latitude"
                            label="Latitude"
                            value={latitude}
                            onChange={e => triggerDetailsHandler("latitude", e.target.value)}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            required
                            id="longitude"
                            label="Longitude"
                            value={longitude}
                            onChange={e => triggerDetailsHandler("longitude", e.target.value)}
                            type="number"
                        />
                    </Grid>
                </Fragment>
            }
        </Fragment>
    );
}

function OnDemandSection (props) {
    const { state } = useContext(Store);
    const { "on demand": { value, trigger } } = state;

    let preview = [];
    if (value === "1") {
        const { ts, tech_info } = trigger;
        preview = [
            { label: "Alert", value: "d1" },
            { label: "Trigger Timestamp", value: moment(ts).format("YYYY-MM-DD HH:mm") },
            { label: "Technical Information", value: tech_info }
        ];
    }

    return (
        <Fragment>
            <Grid item xs={12}>
                <Typography variant="h6">On-Demand (D)</Typography>
                <Typography variant="caption">
                    Note: On-demand triggers are inserted via On-Demand Trigger Form.
                    If you inserted a On-Demand trigger for this site, wait for the trigger
                    to be included on the site&apos;s candidate alert then release it.
                </Typography>
            </Grid>

            {
                value === "1" && <Fragment> {    
                    preview.map(x => <Grid item xs={12} 
                        sm={x.label === "Technical Information" ? 6 : 3 }
                        key={x.label}>
                        { PreviewComp(x) }
                    </Grid>)
                } </Fragment>
            }

            {
                value === "0" && <Grid item xs={12}>
                    <Typography
                        variant="body1" align="center" gutterBottom
                    >
                        This release has data request to end on-demand monitoring (d)
                        OR the monitoring event has other positive triggers*.
                    </Typography>

                    <Typography
                        variant="caption" align="center"
                    >
                        *If there is other released positive threshold aside form on-demand trigger, 
                        data presence for this trigger is not observed (default to d).
                    </Typography>
                </Grid>
            }

            {
                value === "-1" && <Typography
                    variant="body1" align="center"
                    component={Grid} item xs={12}
                >
                    No on-demand entry present for this release period (d0).
                </Typography>
            }
        </Fragment>
    );
}

const PreviewComp = x => (
    <Fragment>
        <Typography variant="body2" color="textSecondary" align="center">{x.label}</Typography>
        <Typography variant="body1" color="textPrimary" align="center">
            {x.value}
        </Typography>
    </Fragment>
);

function ThirdStep (props) {
    const { isLoading } = props;
    const { state, dispatch } = useContext(Store);

    let internal_alert = "---";
    let note = null;
    const release_triggers = [];
    if (state.preview) {
        const { internal_alert: temp, note: n, trigger_list } = state.preview;
        internal_alert = temp;
        note = n;

        release_triggers.push(...trigger_list);
    }

    const preview = [
        { label: "Site", value: state.site.data.site_code.toUpperCase() },
        { label: "Internal Alert", value: internal_alert },
        { label: "Data Timestamp", value: moment(state.data_ts).format("YYYY-MM-DD HH:mm") },
        { label: "Release Time", value: state.release_time.format("HH:mm") }
    ];

    const ReleaseTriggersSummary = rt => {
        return <Fragment>
            { rt.length !== 0 && <Grid item xs={12} container>
                <Typography 
                    variant="body1" 
                    component={Grid} item xs={12}
                    align="center"
                >
                    <strong>Release Triggers</strong>
                </Typography>

                {
                    rt.map(x => {
                        const alert_sym = `${x.alert_symbol}${x.alert_level}`;
                        const preview_2 = [
                            { label: "Source", value: `${capitalize(x.source)} (${alert_sym})` },
                            { label: "Trigger Timestamp", value: moment(x.ts).format("YYYY-MM-DD HH:mm:00") },
                            { label: "Technical Information", value: x.tech_info }
                        ];
                    
                        return <Grid item xs={12} container key={alert_sym} spacing={1} style={{ margin: "1em 0" }}>
                            {
                                preview_2.map(y => 
                                    <Grid item xs={12} 
                                        sm={y.label === "Technical Information" ? 6 : 3 } 
                                        key={y.label}>
                                        { PreviewComp(y)}
                                    </Grid>
                                )
                            }
                        </Grid>; 
                    } )
                }
            </Grid> }
        </Fragment>;
    };

    return <Fragment>
        {
            isLoading ? <LoadingComponent message="Calculating internal alert..." />
                : <Fragment>
                    <Typography 
                        variant="h6"
                        component={Grid} item xs={12}
                        align="center"
                    >
                        Alert Release Summary
                    </Typography>

                    {
                        note && <Typography 
                            variant="body1" color="error"
                            component={Grid} item xs={12}
                            align="center"
                        >
                            { note }
                        </Typography>
                    }

                    {
                        preview.map(x => <Grid item xs={6} sm={3} key={x.label}>
                            { PreviewComp(x) }
                        </Grid>)
                    }

                    { ReleaseTriggersSummary(release_triggers) }

                    {
                        state.previous_release.event_alert.public_alert_symbol.alert_level 
                        > 0 && <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch
                                    checked={state.manually_lower_alert}
                                    onChange={e => Actions.updateManuallyLowerAlert({
                                        dispatch, payload: e.target.checked
                                    })}
                                    value="lower_to_a0"
                                />}
                                label="Manually Lower to Alert 0"
                            />
                        </Grid>
                    }

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
                            changeHandler={e => Actions.updateCTPersonnel({ dispatch, payload: e.target.value })}
                            required
                            helperText={state.validation.iomp_ct || ""}
                            error={Boolean(state.validation.iomp_ct)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Comments"
                            multiline
                            rowsMax="2"
                            placeholder="Enter additional comments necessary"
                            value={state.comments}
                            onChange={e => Actions.updateComments({ dispatch, payload: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                </Fragment>
        }
    </Fragment>;
}

function AlertReleaseForm (props) {
    const { activeStep, isLoading } = props;

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
                    activeStep === 1 && <SecondStep isLoading={isLoading} />
                }
                {
                    activeStep === 2 && <ThirdStep isLoading={isLoading} />
                }
            </Grid>
        </MuiPickersUtilsProvider>
    );
}

export default AlertReleaseForm;