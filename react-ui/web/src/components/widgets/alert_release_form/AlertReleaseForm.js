import React, { Fragment, useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
    TextField, Grid, withStyles,
    FormControl, FormLabel, Switch
} from "@material-ui/core";

// Stepper Related Imports
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Typography from "@material-ui/core/Typography";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker, KeyboardTimePicker } from "@material-ui/pickers";
import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import SubsurfaceTriggerGroup from "./SubsurfaceTriggerGroup";
import SurficialTriggerGroup from "./SurficialTriggerGroup";
import MomsTriggerGroup from "./MomsTriggerGroup";
import RainfallTriggerGroup from "./RainfallTriggerGroup";
import EarthquakeTriggerGroup from "./EarthquakeTriggerGroup";
import OnDemandTriggerGroup from "./OnDemandTriggerGroup";

import { sites } from "../../../store";

import { getInternalAlertLevel } from "./ajax";

// NOTE: sites should be replaced with DynaslopeSiteSelectInputForm. Note to self.
const site_names = [{ site_id: "1", site_name: "AGB (Agbatuan, Dumarao, Capiz)" }, { site_id: "2", site_name: "BAK (Poblacion, Bakun, Benguet)" }, { site_id: "3", site_name: "BAN (Banlasan, Calape, Bohol)" }, { site_id: "4", site_name: "BAR (Baras, Tarangnan, Samar)" }, { site_id: "5", site_name: "BAY (Bayabas, Labo, Camarines Norte)" }, { site_id: "6", site_name: "BLC (Boloc, Tubungan, Iloilo)" }, { site_id: "7", site_name: "BOL (Bolodbolod, St. Bernard, Southern Leyte)" }, { site_id: "8", site_name: "BTO (Bato, Sibonga, Cebu)" }, { site_id: "9", site_name: "CAR (San Carlos, Dapa, Surigao del Norte)" }, { site_id: "10", site_name: "CUD (Natuwolan at Wadwad, Cudog, Lagawe, Ifugao)" }, { site_id: "11", site_name: "DAD (Sagasa, Dadong, Tarragona, Davao Oriental)" }, { site_id: "12", site_name: "GAA (Gaas, Balamban, Cebu)" }, { site_id: "13", site_name: "GAM (Gamut, Tago, Surigao del Sur)" }, { site_id: "14", site_name: "HIN (1 & 2, Hinabangan, Samar)" }, { site_id: "15", site_name: "HUM (Humayhumay, Guihulngan City, Negros Oriental)" }, { site_id: "16", site_name: "IME (Imelda, Tarangnan, Samar)" }, { site_id: "17", site_name: "IMU (Immuli, Pidigan, Abra)" }, { site_id: "18", site_name: "INA (Sambag, Inabasan, Maasin, Iloilo)" }, { site_id: "19", site_name: "JOR (Poblacion 1, San Jorge, Samar)" }, { site_id: "20", site_name: "LAB (Labey, Ambuklao, Bokod, Benguet)" }, { site_id: "21", site_name: "LAY (Laygayon, Pinabacdao, Samar)" }, { site_id: "22", site_name: "LIP (Lipanto, St. Bernard, Southern Leyte)" }, { site_id: "23", site_name: "LOO (Looc, Villanueva, Misamis Oriental)" }, { site_id: "24", site_name: "LPA (Lipata, Paranas, Samar)" }, { site_id: "25", site_name: "LTE (Literon, Calbiga, Samar)" }, { site_id: "26", site_name: "LUN (Caianuhan, Lunas, Maasin City, Southern Leyte)" }, { site_id: "27", site_name: "MAG (Magsaysay, Kibawe, Bukidnon)" }, { site_id: "28", site_name: "MAM (Mamuyod, Ambassador, Tublay, Benguet)" }, { site_id: "29", site_name: "MAR (Marirong, Leon, Iloilo)" }, { site_id: "30", site_name: "MCA (Mac-Arthur, Esperanza, Agusan del Sur)" }, { site_id: "31", site_name: "MNG (Dao, Manghulyawon, La Libertad, Negros Oriental)" }, { site_id: "32", site_name: "MSL (Lower Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "33", site_name: "MSU (Upper Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "34", site_name: "NAG (Nagyubuyuban, San Fernando City, La Union)" }, { site_id: "35", site_name: "NUR (Nurcia, Lanuza, Surigao del Sur)" }, { site_id: "36", site_name: "OSL (Oslao, San Francisco, Surigao del Norte)" }, { site_id: "37", site_name: "PAR (Parasanon, Pinabacdao, Samar)" }, { site_id: "38", site_name: "PEP (Bangi, Pepe, Leon, Iloilo)" }, { site_id: "39", site_name: "PIN (Pinagkamaligan, Calauag, Quezon)" }, { site_id: "40", site_name: "PLA (Mambog, Planas, Guihulngan City, Negros Oriental)" }, { site_id: "41", site_name: "PNG (Pange, Matnog, Sorsogon)" }, { site_id: "42", site_name: "PUG (Longlong, Puguis, La Trinidad, Benguet)" }, { site_id: "43", site_name: "SAG (Antadao, Sagada, Mt. Province)" }, { site_id: "44", site_name: "SIB (Sibajay, Boston, Davao Oriental)" }, { site_id: "45", site_name: "SIN (Sinipsip, Amgaleyguey, Buguias, Benguet)" }, { site_id: "46", site_name: "SUM (Sumalsag, Malitbog, Bukidnon)" }, { site_id: "47", site_name: "TAL (Talahid, Almeria, Biliran)" }, { site_id: "48", site_name: "TGA (Taga, Pinukpuk, Kalinga)" }, { site_id: "49", site_name: "TUE (Tue, Tadian, Mt. Province)" }, { site_id: "50", site_name: "UMI (Umingan, Alimodian, Iloilo)" }];
const users = [];

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
    const { setModalTitle, generalData, classes, handleEventChange, handleDateTime, setCTFullName, setMTFullName } = props;
    const {
        siteId, dataTimestamp, releaseTime,
        reporterIdMt, reporterIdCt
    } = generalData;

    useEffect(() => {
        setModalTitle((<Typography variant="h6" color="primary">Release Information</Typography>));
    }, []);

    return (
        <Fragment>
            <Grid item xs={12} className={classes.inputGridContainer}>
                <SelectInputForm
                    label="Site"
                    div_id="site_id"
                    changeHandler={handleEventChange("siteId")}
                    value={siteId}
                    list={site_names}
                    mapping={{ id: "site_id", label: "site_name" }}
                    css={classes.selectInput}
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <KeyboardDateTimePicker
                    required
                    autoOk
                    label="Data Timestamp"
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
                    label="Time of Release"
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
                    label="IOMP-MT"
                    div_id="reporter_id_mt"
                    changeHandler={handleEventChange("reporterIdMt")}
                    value={reporterIdMt}
                    disabled="true"
                    returnFullNameCallback={ret => {
                        console.log("mt ret", ret);
                        setMTFullName(ret);
                    }}
                />
            </Grid>

            <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                <DynaslopeUserSelectInputForm
                    variant="standard"
                    label="IOMP-CT"
                    div_id="reporter_id_ct"
                    changeHandler={handleEventChange("reporterIdCt")}
                    value={reporterIdCt}
                    returnFullNameCallback={ret => {
                        console.log("ct ret", ret);
                        setCTFullName(ret);
                    }}
                />
            </Grid>
        </Fragment>
    );
}

function TriggersInputForm (props) {
    const { 
        classes, triggersState, setTriggersState,
        setModalTitle, hasNoGroundData, setHasNoGroundData
    } = props;
    const [switch_value, setSwitchValue] = useState("");
    const {
        subsurface: { switchState: subs_switch_state },
        surficial: { switchState: surf_switch_state } 
    } = triggersState;

    console.log(subs_switch_state, surf_switch_state);

    useEffect(() => {
        setModalTitle((<Typography variant="h6" color="primary">Release triggers</Typography>));
    }, []);

    return (
        <Fragment>
            {
                !subs_switch_state && !surf_switch_state && (
                    <Grid item xs={12} className={hasNoGroundData ? classes.groupGridContainer : ""}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend" className={classes.formLabel}>
                                <span>No Ground Data (ND)</span>

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

            <Grid item xs={12}>
                <Typography variant="h7" color="secondary">Ground-Related Triggers</Typography>
            </Grid>

            <SubsurfaceTriggerGroup
                triggersState={triggersState}
                setTriggersState={setTriggersState}
            />

            <SurficialTriggerGroup
                triggersState={triggersState}
                setTriggersState={setTriggersState}
            />

            <MomsTriggerGroup
                triggersState={triggersState}
                setTriggersState={setTriggersState}
            />

            <Grid item xs={12}>
                <Typography variant="h7" color="secondary">Secondary Triggers</Typography>
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
        setModalTitle((<Typography variant="h6" color="primary">Release comments</Typography>));
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
    const { generalData, internalAlertLevel, setModalTitle, MTFullName, CTFullName } = props;
    const {
        siteId, publicAlert, dataTimestamp,
        releaseTime, reporterIdMt,
        reporterIdCt
    } = generalData;

    useEffect(() => {
        setModalTitle((<Typography variant="h6" color="primary">Release Summary</Typography>));
    }, []);

    const site = site_names.find(obj => obj.site_id === siteId);
    // const mt = users.find(obj => obj.user_id === reporterIdMt);
    // const ct = users.find(obj => obj.user_id === reporterIdCt);
    // const data_ts = moment(dataTimestamp).format("YYYY-MM-DD HH:mm:00");
    const data_ts = moment(dataTimestamp).format("MMMM Mo YYYY HH:mm");
    const release_time = moment(releaseTime).format("HH:mm");

    return (
        <Fragment>
            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">Site</Typography>
                <Typography variant="body1" color="textPrimary">
                    {site.site_name}
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
                <Typography variant="body1" color="textSecondary">MT</Typography>
                <Typography variant="body1" color="textPrimary">
                    {MTFullName}
                </Typography>
            </Grid>
            <Grid item xs={6} >
                <Typography variant="body1" color="textSecondary">CT</Typography>
                <Typography variant="body1" color="textPrimary">
                    {CTFullName}
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

    const changeState = (key, value) => {
        if (key === "siteId") {
            // get the current Internal alert level of site
            const input = { site_id: value };
            getInternalAlertLevel(input, ret => {
                const site = sites.find(o => o.site_id === value);
                const { site_code } = site;
                console.log("site_code", site_code);
                setGeneralData({
                    ...generalData,
                    site_code
                });
                const { internal_alert_level, public_alert_level, trigger_list_str } = ret;
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
                />);
            case 1:
                return <TriggersInputForm {...props}/>;
            case 2:
                return <CommentsInputForm {...props} handleEventChange={handleEventChange}/>;
            case 3:
                return <SummaryForm {...props} internalAlertLevel={internalAlertLevel}/>;
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
