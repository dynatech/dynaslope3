import React, { Fragment, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
    TextField, Grid, withStyles
} from "@material-ui/core";

// Stepper Related Imports
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Typography from "@material-ui/core/Typography";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";

// NOTE: sites should be replaced with DynaslopeSiteSelectInputForm. Note to self.
const sites = [{ site_id: "1", site_name: "AGB (Agbatuan, Dumarao, Capiz)" }, { site_id: "2", site_name: "BAK (Poblacion, Bakun, Benguet)" }, { site_id: "3", site_name: "BAN (Banlasan, Calape, Bohol)" }, { site_id: "4", site_name: "BAR (Baras, Tarangnan, Samar)" }, { site_id: "5", site_name: "BAY (Bayabas, Labo, Camarines Norte)" }, { site_id: "6", site_name: "BLC (Boloc, Tubungan, Iloilo)" }, { site_id: "7", site_name: "BOL (Bolodbolod, St. Bernard, Southern Leyte)" }, { site_id: "8", site_name: "BTO (Bato, Sibonga, Cebu)" }, { site_id: "9", site_name: "CAR (San Carlos, Dapa, Surigao del Norte)" }, { site_id: "10", site_name: "CUD (Natuwolan at Wadwad, Cudog, Lagawe, Ifugao)" }, { site_id: "11", site_name: "DAD (Sagasa, Dadong, Tarragona, Davao Oriental)" }, { site_id: "12", site_name: "GAA (Gaas, Balamban, Cebu)" }, { site_id: "13", site_name: "GAM (Gamut, Tago, Surigao del Sur)" }, { site_id: "14", site_name: "HIN (1 & 2, Hinabangan, Samar)" }, { site_id: "15", site_name: "HUM (Humayhumay, Guihulngan City, Negros Oriental)" }, { site_id: "16", site_name: "IME (Imelda, Tarangnan, Samar)" }, { site_id: "17", site_name: "IMU (Immuli, Pidigan, Abra)" }, { site_id: "18", site_name: "INA (Sambag, Inabasan, Maasin, Iloilo)" }, { site_id: "19", site_name: "JOR (Poblacion 1, San Jorge, Samar)" }, { site_id: "20", site_name: "LAB (Labey, Ambuklao, Bokod, Benguet)" }, { site_id: "21", site_name: "LAY (Laygayon, Pinabacdao, Samar)" }, { site_id: "22", site_name: "LIP (Lipanto, St. Bernard, Southern Leyte)" }, { site_id: "23", site_name: "LOO (Looc, Villanueva, Misamis Oriental)" }, { site_id: "24", site_name: "LPA (Lipata, Paranas, Samar)" }, { site_id: "25", site_name: "LTE (Literon, Calbiga, Samar)" }, { site_id: "26", site_name: "LUN (Caianuhan, Lunas, Maasin City, Southern Leyte)" }, { site_id: "27", site_name: "MAG (Magsaysay, Kibawe, Bukidnon)" }, { site_id: "28", site_name: "MAM (Mamuyod, Ambassador, Tublay, Benguet)" }, { site_id: "29", site_name: "MAR (Marirong, Leon, Iloilo)" }, { site_id: "30", site_name: "MCA (Mac-Arthur, Esperanza, Agusan del Sur)" }, { site_id: "31", site_name: "MNG (Dao, Manghulyawon, La Libertad, Negros Oriental)" }, { site_id: "32", site_name: "MSL (Lower Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "33", site_name: "MSU (Upper Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "34", site_name: "NAG (Nagyubuyuban, San Fernando City, La Union)" }, { site_id: "35", site_name: "NUR (Nurcia, Lanuza, Surigao del Sur)" }, { site_id: "36", site_name: "OSL (Oslao, San Francisco, Surigao del Norte)" }, { site_id: "37", site_name: "PAR (Parasanon, Pinabacdao, Samar)" }, { site_id: "38", site_name: "PEP (Bangi, Pepe, Leon, Iloilo)" }, { site_id: "39", site_name: "PIN (Pinagkamaligan, Calauag, Quezon)" }, { site_id: "40", site_name: "PLA (Mambog, Planas, Guihulngan City, Negros Oriental)" }, { site_id: "41", site_name: "PNG (Pange, Matnog, Sorsogon)" }, { site_id: "42", site_name: "PUG (Longlong, Puguis, La Trinidad, Benguet)" }, { site_id: "43", site_name: "SAG (Antadao, Sagada, Mt. Province)" }, { site_id: "44", site_name: "SIB (Sibajay, Boston, Davao Oriental)" }, { site_id: "45", site_name: "SIN (Sinipsip, Amgaleyguey, Buguias, Benguet)" }, { site_id: "46", site_name: "SUM (Sumalsag, Malitbog, Bukidnon)" }, { site_id: "47", site_name: "TAL (Talahid, Almeria, Biliran)" }, { site_id: "48", site_name: "TGA (Taga, Pinukpuk, Kalinga)" }, { site_id: "49", site_name: "TUE (Tue, Tadian, Mt. Province)" }, { site_id: "50", site_name: "UMI (Umingan, Alimodian, Iloilo)" }];
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


function NarrativeForm (props) {
    console.log(props);
    const {
        classes, narrativeData,
        setNarrativeData
    } = props;

    const {
        site_id, narrative, event_id,
        type_id, timestamp, user_id
    } = narrativeData;

    const handleDateTime = key => value => {
        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    const handleEventChange = key => event => {
        const { value } = event.target;

        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    return (

        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >
 
                <Grid item xs={12} className={classes.inputGridContainer}>
                    <SelectInputForm
                        label="Site"
                        div_id="site_id"
                        changeHandler={handleEventChange("site_id")}
                        value={site_id}
                        list={sites}
                        mapping={{ id: "site_id", label: "site_name" }}
                        css={classes.selectInput}
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="Reporter"
                        div_id="user_id"
                        changeHandler={handleEventChange("user_id")}
                        value={user_id}
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <KeyboardDateTimePicker
                        required
                        autoOk
                        label="Timestamp"
                        value={timestamp}
                        onChange={handleDateTime("timestamp")}
                        ampm={false}
                        placeholder="2010/01/01 00:00"
                        format="YYYY/MM/DD HH:mm"
                        mask="__/__/____ __:__"
                        clearable
                        disableFuture
                    />
                </Grid>

                <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                    <TextField
                        required
                        id="standard-multiline-static"
                        label="Narrative"
                        value={narrative}
                        onChange={handleEventChange("narrative")}
                        placeholder="Enter narrative"
                        multiline
                        rows="4"
                        rowsMax={4}
                        fullWidth
                        className={classes.textField}
                        variant="filled"
                    />
                </Grid>

            </Grid>
        </MuiPickersUtilsProvider>           
    );
}


export default withStyles(styles)(NarrativeForm);
