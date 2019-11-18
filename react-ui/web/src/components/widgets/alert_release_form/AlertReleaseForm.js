import React, { Fragment, useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import {
    TextField, Grid, withStyles,
    FormControl, FormLabel, Switch,
    Divider
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker, KeyboardTimePicker } from "@material-ui/pickers";

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

import { sites } from "../../../store";

import { getInternalAlertLevel } from "./ajax";

const styles = theme => ({
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
});


function GeneralInputForm (props) {
    const {
        setModalTitle, generalData, classes,
        handleEventChange, handleDateTime,
        setGeneralData, setCTFullName, setMTFullName
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
    };

    return (
        <Fragment>
            <Grid item xs={12} className={classes.inputGridContainer}>
                <DynaslopeSiteSelectInputForm
                    value={siteId}
                    changeHandler={value => setSite(value)}
                    // renderDropdownIndicator={false}
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
                    disabled="true"
                    returnFullNameCallback={ret => setMTFullName(ret)}
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="CT Personnel"
                    div_id="reporter_id_ct"
                    changeHandler={handleEventChange("reporterIdCt")}
                    value={reporterIdCt}
                    returnFullNameCallback={ret => setCTFullName(ret)}
                />
            </Grid>
        </Fragment>
    );
}

function TriggersInputForm (props) {
    const { 
        classes, triggersState, setTriggersState,
        setModalTitle, hasNoGroundData, setHasNoGroundData,
        triggersReleased
    } = props;
    const {
        subsurface: { switchState: subs_switch_state },
        surficial: { switchState: surf_switch_state } 
    } = triggersState;

    useEffect(() => {
        setModalTitle("Add triggers if not yet included in this release.");
    }, []);

    return (
        <Fragment>
            {
                !subs_switch_state && !surf_switch_state && (
                    <Grid item xs={12} className={hasNoGroundData ? classes.groupGridContainer : ""}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend" className={classes.formLabel}>
                                <span style={{ color: "#f50057" }}>No Ground Data (ND)</span>
                                <Switch
                                    checked={hasNoGroundData}
                                    onChange={event => setHasNoGroundData(event.target.checked)}
                                    value={hasNoGroundData}
                                />
                            </FormLabel>
                        </FormControl>
                    </Grid>
                )
            }

            <Grid item xs={12} style={{ paddingTop: "20px" }}>
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
            
            <Grid item xs={12} style={{ paddingTop: "20px" }}>
                <Typography variant="h6" color="secondary">Secondary Triggers</Typography>
            </Grid>

            <RainfallTriggerGroup
                triggersState={triggersState}
                setTriggersState={setTriggersState}
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
    );
}

function CommentsInputForm (props) {
    const { generalData: { comments }, handleEventChange, classes, setModalTitle } = props;

    useEffect(() => {
        setModalTitle("Write your release comments.");
    }, []);

    return (
        <Fragment>
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
    );
}

function SummaryForm (props) {
    const {
        classes,
        generalData, internalAlertLevel, setModalTitle,
        mtFullName, ctFullName, ewiPayload: { trigger_list_arr }
    } = props;
    const {
        siteId, dataTimestamp, releaseTime, comments
    } = generalData;

    const [triggers_display, setTriggersDisplay] = useState(null);

    useEffect(() => {
        setModalTitle("Review release summary.");

        let temp_list = (<Typography variant="body2" color="textPrimary">No triggers included in this release.</Typography>);
        if (trigger_list_arr.length > 0) {
            temp_list = trigger_list_arr.map((element, index) => {
                console.log(element, index);
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
    }, []);

    const data_ts = moment(dataTimestamp).format("DD MMMM YYYY, HH:mm");
    // const data_ts = moment(dataTimestamp).format("MMMM Mo YYYY HH:mm");
    const release_time = moment(releaseTime).format("HH:mm");

    return (
        <Fragment>
            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">Site</Typography>
                <Typography variant="body1" color="textPrimary">
                    {/* {site.site_name} */}
                    {siteId.label}
                </Typography>
            </Grid>
            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">Alert Level</Typography>
                <Typography variant="body1" color="textPrimary">
                    {internalAlertLevel}
                </Typography>
            </Grid>

            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">Data Timestamp</Typography>
                <Typography variant="body1" color="textPrimary">
                    {data_ts}
                </Typography>
            </Grid>
            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">Release Time</Typography>
                <Typography variant="body1" color="textPrimary">
                    {release_time}
                </Typography>
            </Grid>

            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">MT Personnel</Typography>
                <Typography variant="body1" color="textPrimary">
                    {mtFullName}
                </Typography>
            </Grid>

            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">CT Personnel</Typography>
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
                <Grid item xs={12} container spacing={1}>
                    {triggers_display}
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Divider className={classes.divider} /> 
            </Grid>

            <Grid item xs={12} >
                <Typography variant="button" color="textSecondary">Comments</Typography>
                <Typography variant="body2" color="textPrimary">
                    {
                        comments !== "" ? (
                            comments 
                        ) : (
                            "No comment provided"
                        )
                    }
                </Typography>
            </Grid>
        </Fragment>
    );
}

function AlertReleaseForm (props) {
    const {
        classes, activeStep, generalData,
        setGeneralData, setInternalAlertLevel,
        internalAlertLevel, setTriggerList,
        setPublicAlertLevel
    } = props;

    const [mtFullName, setMTFullName] = useState("");
    const [ctFullName, setCTFullName] = useState("");

    const [triggersReleased, setTriggersReleased] = useState([]);

    const changeState = (key, value) => {
        if (key === "siteId") {
            // get the current Internal alert level of site
            const input = { site_id: value };
            getInternalAlertLevel(input, ret => {
                const site = sites.find(o => o.site_id === value);
                const { site_code } = site;
                setGeneralData({
                    ...generalData,
                    site_code
                });
                const {
                    internal_alert_level, public_alert_level, trigger_list_str,
                    trigger_sources
                } = ret;
                setTriggersReleased(trigger_sources);
                setTriggerList(trigger_list_str);
                setPublicAlertLevel(public_alert_level);
                // set the status on form
                setInternalAlertLevel(internal_alert_level);
            });
        }
        setGeneralData({ ...generalData, [key]: value });
    };

    const handleDateTime = key => value => {
        changeState(key, value);
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        changeState(key, value);
    };

    const getSteps = () => {
        return ["What are the release details?", "List the triggers.", "Add Comments and Description", "Review Release Summary"];
    };
    const steps = getSteps();

    const getStepContent = stepIndex => {
        switch (stepIndex) {
            case 0:
                return (<GeneralInputForm
                    {...props}
                    handleDateTime={handleDateTime}
                    handleEventChange={handleEventChange}
                    setMTFullName={setMTFullName}
                    setCTFullName={setCTFullName}
                />);
            case 1:
                return <TriggersInputForm {...props} triggersReleased={triggersReleased} />;
            case 2:
                return <CommentsInputForm {...props} handleEventChange={handleEventChange}/>;
            case 3:
                return <SummaryForm {...props} 
                    mtFullName={mtFullName}
                    ctFullName={ctFullName}
                    internalAlertLevel={internalAlertLevel}
                />;
            case 4:
                return (
                    <Typography variant="body1">EWI Released!</Typography>
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

export default withStyles(styles)(AlertReleaseForm);
