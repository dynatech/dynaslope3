import React, { Fragment, useEffect, useState } from "react";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import {
    TextField, Grid,
    FormControl, FormLabel, Switch,
    Divider, makeStyles, CircularProgress
} from "@material-ui/core";
import {
    MuiPickersUtilsProvider,
    KeyboardDateTimePicker, KeyboardTimePicker
} from "@material-ui/pickers";

// Stepper Related Imports
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Typography from "@material-ui/core/Typography";

// Form Related Imports
import SubsurfaceTriggerGroup from "./SubsurfaceTriggerGroup";
import SurficialTriggerGroup from "./SurficialTriggerGroup";
import MomsTriggerGroup from "./MomsTriggerGroup";
import RainfallTriggerGroup from "./RainfallTriggerGroup";
import EarthquakeTriggerGroup from "./EarthquakeTriggerGroup";
import OnDemandTriggerGroup from "./OnDemandTriggerGroup";

// Widgets
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

import { getLatestSiteRelease } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";
import { CTContext } from "../../monitoring/dashboard/CTContext";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    },
    checkboxGridContainer: {
        marginTop: 12,
        marginBottom: 6
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        width: "90%",
    },
    backButton: {
        marginRight: 1
    },
    instructions: {
        marginTop: 1,
        marginBottom: 1,
    }
}));

function returnUpdateWarning () {
    return (
        <Fragment>
            <Grid item xs={12} >
                <Typography variant="body2" color="secondary">
                    You chose a data timestamp that has been released. 
                    You are allowed to update release details but changes on triggers and alert level cannot be accepted. 
                    For those kind of changes, please contact the Software Infra Devs. Thank you.
                </Typography>
            </Grid>
        </Fragment>
    );
}

function GeneralInputForm (props) {
    const {
        setModalTitle, generalData, classes,
        handleEventChange, handleDateTime,
        setGeneralData, isUpdatingRelease,
        changeState
    } = props;

    const {
        siteId, dataTimestamp, releaseTime,
        reporterIdMt, reporterIdCt
    } = generalData;

    useEffect(() => {
        setModalTitle("Provide information to the following fields.");
    }, []);

    const setSite = ret => {
        const { label, data } = ret;
        setGeneralData({
            ...generalData,
            siteId: ret,
            address: label,
            siteCode: data.site_code
        });
        changeState("siteId", ret);
    };

    return (
        <Fragment>
            {
                isUpdatingRelease && returnUpdateWarning()
            }
            <Grid item xs={12} className={classes.inputGridContainer}>
                <DynaslopeSiteSelectInputForm
                    value={siteId}
                    changeHandler={value => setSite(value)}
                />                
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    label="Data timestamp"
                    value={dataTimestamp}
                    onChange={handleDateTime("dataTimestamp")}
                    ampm={false}
                    placeholder="2010/01/01 00:00"
                    format="YYYY/MM/DD HH:mm"
                    mask="__/__/____ __:__"
                    clearable
                    disableFuture
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <KeyboardTimePicker
                    required
                    autoOk
                    ampm={false}
                    label="Time of release"
                    mask="__:__"
                    placeholder="00:00"
                    value={releaseTime}
                    onChange={handleDateTime("releaseTime")}
                    clearable
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="MT Personnel"
                    div_id="reporter_id_mt"
                    changeHandler={handleEventChange("reporterIdMt")}
                    value={reporterIdMt}
                    disabled
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="CT Personnel"
                    div_id="reporter_id_ct"
                    changeHandler={handleEventChange("reporterIdCt")}
                    value={reporterIdCt}
                    disabled
                />
            </Grid>
        </Fragment>
    );
}

function TriggersInputForm (props) {
    const { 
        classes, triggersState, setTriggersState,
        setModalTitle, hasNoGroundData, setHasNoGroundData,
        triggersReleased, alert_level, setAlert0, isAlert0
    } = props;

    const {
        subsurface: { switchState: subs_switch_state },
        surficial: { switchState: surf_switch_state },
        moms: { switchState: moms_switch_state } 
    } = triggersState;

    useEffect(() => {
        setModalTitle("Toggle ON all the triggers to be included in the internal alert computation, otherwise toggle them OFF. " +
        "Fill in the required fields for each selected trigger.");
    }, []);
    
    return (
        <Fragment>
            {
                alert_level !== 0 && (
                    <Grid item xs={12} className={isAlert0 ? classes.groupGridContainer : ""}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend" className={classes.formLabel}>
                                <span style={{ color: "#f50057" }}>Lower to Alert 0</span>
                                <Switch
                                    checked={isAlert0}
                                    onChange={event => setAlert0(event.target.checked)}
                                    value="has_no_ground_data"
                                />
                            </FormLabel>
                        </FormControl>
                    </Grid>
                )
            }
            {
                !subs_switch_state && !surf_switch_state && !moms_switch_state && alert_level <= 1 && (
                    <Grid item xs={12} className={hasNoGroundData ? classes.groupGridContainer : ""}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend" className={classes.formLabel}>
                                <span style={{ color: "#f50057" }}>No Ground Data (ND)</span>
                                <Switch
                                    checked={hasNoGroundData}
                                    onChange={event => setHasNoGroundData(event.target.checked)}
                                    value="has_no_ground_data"
                                />
                            </FormLabel>
                        </FormControl>
                    </Grid>
                )
            }
            {
                isAlert0 === false && (
                    <Fragment>
                        <Grid item xs={12}>
                            <Typography variant="h6" color="secondary">Ground-Related Triggers</Typography>
                        </Grid>
                        <SubsurfaceTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                            triggersReleased={triggersReleased}
                        />
                        <SurficialTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                            triggersReleased={triggersReleased}
                        />

                        <MomsTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                        />

                        <Grid item xs={12} style={{ paddingTop: 20 }}>
                            <Typography variant="h6" color="secondary">Secondary Triggers</Typography>
                        </Grid>

                        <RainfallTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                            triggersReleased={triggersReleased}
                        />

                        <EarthquakeTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                        />

                        <OnDemandTriggerGroup
                            triggersState={triggersState}
                            setTriggersState={setTriggersState}
                        />
                    </Fragment>
                )
            }

            
        </Fragment>
    );
}

function SummaryForm (props) {
    const {
        classes, handleEventChange,
        generalData, internalAlertLevel, setModalTitle,
        mtFullName, ctFullName, ewiPayload,
        isAlertRecomputing
    } = props;
    const {
        siteId, dataTimestamp, releaseTime, comments
    } = generalData;

    const [triggers_display, setTriggersDisplay] = useState(null);

    useEffect(() => {
        setModalTitle("Review release summary. Add comment if necessary.");

        let arr = [];
        if (typeof ewiPayload.trigger_list_arr !== "undefined") {
            arr = ewiPayload.trigger_list_arr;
        }

        let temp_list = <Typography variant="body2" color="textPrimary" align="center">
            No triggers included in this release.
        </Typography>;

        if (arr.length > 0) {
            temp_list = arr.map((element, index) => {
                const {
                    ts_updated, alert_level, trigger_type,
                    tech_info
                } = element;
    
                const trig_source = trigger_type.charAt(0).toUpperCase() + trigger_type.slice(1);
                const timestamp = moment(ts_updated).format("DD MMMM YYYY, HH:mm");
                return (
                    <Fragment key={`${index + 1}`}>
                        <Grid item xs={6} align="center">
                            <Typography variant="body2" color="textSecondary">Trigger</Typography>
                            <Typography variant="body2" color="textPrimary">{`${trig_source} Alert ${alert_level}`}</Typography>
                        </Grid>
    
                        <Grid item xs={6} align="center">
                            <Typography variant="body2" color="textSecondary">Trigger timestamp</Typography>
                            <Typography variant="body2" color="textPrimary">{timestamp}</Typography>
                        </Grid>
    
                        <Grid item xs={12} align="center" style={{ paddingBottom: 20 }}>
                            <Typography variant="body2" color="textSecondary">Tech info</Typography>
                            <Typography variant="caption" color="textPrimary">{tech_info}</Typography>
                        </Grid>
                    </Fragment>
                );
            });
        }
        setTriggersDisplay(temp_list);
    }, [ewiPayload]);

    const data_ts = moment(dataTimestamp).format("DD MMMM YYYY, HH:mm");
    const release_time = moment(releaseTime).format("HH:mm");

    return (
        <Fragment>
            {
                isAlertRecomputing ? (
                    <Grid item xs={6}>
                        <CircularProgress />
                    </Grid>
                ) : (
                    <Fragment>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Site</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {siteId.label}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Internal Alert</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {internalAlertLevel}
                            </Typography>
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Data Timestamp</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {data_ts}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Release Time</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {release_time}
                            </Typography>
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">MT Personnel</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {mtFullName}
                            </Typography>
                        </Grid>

                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">CT Personnel</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {ctFullName}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider className={classes.divider} /> 
                        </Grid>
            
                        <Grid item xs={12} container spacing={1}>
                            <Grid item xs={12}>
                                <Typography variant="button" color="textSecondary">Triggers</Typography>
                            </Grid>
                            <Grid item xs={12} container spacing={1} align="center">
                                {triggers_display}
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider className={classes.divider} /> 
                        </Grid>

                        <Grid item xs={12} className={classes.inputGridContainer}>
                            <TextField
                                label="Comments"
                                multiline
                                rowsMax="2"
                                placeholder="Enter additional comments necessary"
                                value={comments}
                                onChange={handleEventChange("comments")}
                                fullWidth
                            />
                        </Grid>
                    </Fragment>
                )
            }
        </Fragment>
    );
}

function AlertReleaseForm (comp_props) {
    const {
        activeStep, generalData,
        setGeneralData, setInternalAlertLevel,
        internalAlertLevel, // setTriggerList,
        setPublicAlertLevel, isUpdatingRelease,
        currentTriggersStatus, setDBSavedTriggers,
        siteCurrentAlertLevel, setSiteCurrentAlertLevel
    } = comp_props;
    const classes = useStyles();
    const props = { classes, ...comp_props };

    const current_user = getCurrentUser();
    const { first_name, last_name } = current_user;
    const mtFullName = `${last_name}, ${first_name}`;
    const { ct_full_name: ctFullName } = React.useContext(CTContext);

    const [triggersReleased, setTriggersReleased] = useState([...currentTriggersStatus]);

    const changeState = (key, value) => {
        if (key === "siteId") {
            // get the current Internal alert level of site
            const input = { site_id: value.value };
            getLatestSiteRelease(input, ret => {
                console.log(ret);
                const {
                    internal_alert_level, public_alert_level,
                    trigger_sources, alert_level
                } = ret;
                setTriggersReleased(trigger_sources);
                setDBSavedTriggers(trigger_sources);
                setPublicAlertLevel(public_alert_level);
                setInternalAlertLevel(internal_alert_level);
                setSiteCurrentAlertLevel(alert_level);
            });
        } else {
            setGeneralData({ ...generalData, [key]: value });
        }
    };

    const handleDateTime = key => value => {
        changeState(key, value);
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        changeState(key, value);
    };

    const getSteps = () => {
        return ["What are the release details?", "List the triggers.", "Add Comments and Review Release Summary"];
    };
    const steps = getSteps();

    const getStepContent = stepIndex => {
        switch (stepIndex) {
            case 0:
                return <GeneralInputForm
                    {...props}
                    handleDateTime={handleDateTime}
                    handleEventChange={handleEventChange}
                    isUpdatingRelease={isUpdatingRelease}
                    changeState={changeState}
                />;
            case 1:
                return <TriggersInputForm 
                    {...props}
                    triggersReleased={triggersReleased}
                    alert_level={siteCurrentAlertLevel}
                />;
            case 2:
                return <SummaryForm {...props}
                    mtFullName={mtFullName}
                    ctFullName={ctFullName}
                    internalAlertLevel={internalAlertLevel}
                    handleEventChange={handleEventChange}
                />;
            case 3:
                return (
                    <Typography variant="body1">
                        Early warning information released! Please wait for the dashboard to update or check the 
                        site event timeline to confirm if EWI is released.
                    </Typography>
                );
            default:
                return "Uknown stepIndex";
        }
    };

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >

                {getStepContent(activeStep)}
                <div className={classes.root}>
                    <Typography className={classes.instructions} />

                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel />
                            </Step>
                        ))}
                    </Stepper>
                </div>
            </Grid>
        </MuiPickersUtilsProvider>
    );

}

export default AlertReleaseForm;
