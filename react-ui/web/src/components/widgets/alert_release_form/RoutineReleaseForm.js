import React, { Fragment, useEffect, useState } from "react";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import {
    TextField, Grid,
    FormControl, FormLabel, Switch,
    Divider, makeStyles
} from "@material-ui/core";
import {
    MuiPickersUtilsProvider,
    KeyboardDateTimePicker, KeyboardTimePicker
} from "@material-ui/pickers";

import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import DynaslopeSiteCheckboxGroupForm from "../../reusables/DynaslopeSiteCheckboxGroupForm";
import CheckboxesGroup from "../../reusables/CheckboxGroup";
import { getInternalAlertLevel } from "./ajax";
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
    }
}));


function RoutineReleaseForm (comp_props) {
    const {
        routineData, setRoutineData, routineSitesList,
        setRoutineSitesList
    } = comp_props;

    const classes = useStyles();
    const props = { classes, ...comp_props };
    const [cbox_options, setCboxOptions] = useState(null);

    console.log("routineSitesList", routineSitesList);

    let a0_data = [];
    let nd_data = [];
    routineSitesList.forEach(element => {
        const { internal_alert_level, checked_sites, given_sites } = element;
        // SAME VALUES SO THE SITES SELECTED BY CANDIDATE GENERATOR IS CHECKED AND ENABLED BY DEFAULT.
        const temp = { checked_sites, given_sites };
        
        if (internal_alert_level === "A0") a0_data = temp;
        else if (internal_alert_level === "ND") nd_data = temp;
    });

    const { data_timestamp, release_time, reporter_id_ct, reporter_id_mt } = routineData;

    const changeState = (key, value) => {
        setRoutineData({ ...routineData, [key]: value });
    };

    const handleDateTime = key => value => {
        changeState(key, value);
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        changeState(key, value);
    };

    const handleCheckboxEvent = key => value => event => {
        const { target: { checked } } = event;
        console.log(`checked ${key} site ${value}`);
        console.log("value", value);
        if (key === "a0") {
            console.log("do on a0");
            // if ()
        } else if (key === "nd") {
            console.log("do on nd");
        }
        // setNoDataCheckBox({ ...checkboxStatus, [value]: checked });
    };

    console.log("a0_data", a0_data);
    console.log("nd_data", nd_data);

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <KeyboardDateTimePicker
                        required
                        autoOk
                        label="Data timestamp"
                        value={data_timestamp}
                        onChange={handleDateTime("dataTimestamp")}
                        ampm={false}
                        placeholder="2010-01-01 00:00"
                        format="YYYY/MM/DD HH:mm"
                        mask="____-__-__ __:__"
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
                        value={release_time}
                        onChange={handleDateTime("releaseTime")}
                        clearable
                    />
                </Grid>

                {
                    a0_data !== null && (
                        <Grid 
                            item xs={12} container
                            spacing={1} justify="space-evenly"
                        >
                            <DynaslopeSiteCheckboxGroupForm
                                label="A0 Routine Sites"
                                values={a0_data}
                                handleCheckboxEvent={handleCheckboxEvent("a0")}
                            />
                        </Grid> 
                    )
                }


                <Grid 
                    item xs={12} container
                    spacing={1} justify="space-around"
                >
                    <DynaslopeSiteCheckboxGroupForm
                        label="ND Routine Sites"
                        values={nd_data}
                        handleCheckboxEvent={handleCheckboxEvent("nd")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="MT Personnel"
                        div_id="reporter_id_mt"
                        changeHandler={handleEventChange("reporter_id_mt")}
                        value={reporter_id_mt}
                        disabled
                        // returnFullNameCallback={ret => setMTFullName(ret)}
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="CT Personnel"
                        div_id="reporter_id_ct"
                        changeHandler={handleEventChange("reporter_id_ct")}
                        value={reporter_id_ct}
                        disabled
                        // returnFullNameCallback={ret => setCTFullName(ret)}
                    />
                </Grid>
            </Grid>
        </MuiPickersUtilsProvider>
    );

}

export default RoutineReleaseForm;
