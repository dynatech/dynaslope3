import React, { Component } from "react";
import {
    TextField, Grid, withStyles, Divider
} from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker, KeyboardTimePicker } from "@material-ui/pickers";
import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import SubsurfaceTriggerGroup from "./SubsurfaceTriggerGroup";
import SurficialTriggerGroup from "./SurficialTriggerGroup";
import RainfallTriggerGroup from "./RainfallTriggerGroup";
import EarthquakeTriggerGroup from "./EarthquakeTriggerGroup";
import OnDemandTriggerGroup from "./OnDemandTriggerGroup";

const sites = [{ site_id: "1", site_name: "AGB (Agbatuan, Dumarao, Capiz)" }, { site_id: "2", site_name: "BAK (Poblacion, Bakun, Benguet)" }, { site_id: "3", site_name: "BAN (Banlasan, Calape, Bohol)" }, { site_id: "4", site_name: "BAR (Baras, Tarangnan, Samar)" }, { site_id: "5", site_name: "BAY (Bayabas, Labo, Camarines Norte)" }, { site_id: "6", site_name: "BLC (Boloc, Tubungan, Iloilo)" }, { site_id: "7", site_name: "BOL (Bolodbolod, St. Bernard, Southern Leyte)" }, { site_id: "8", site_name: "BTO (Bato, Sibonga, Cebu)" }, { site_id: "9", site_name: "CAR (San Carlos, Dapa, Surigao del Norte)" }, { site_id: "10", site_name: "CUD (Natuwolan at Wadwad, Cudog, Lagawe, Ifugao)" }, { site_id: "11", site_name: "DAD (Sagasa, Dadong, Tarragona, Davao Oriental)" }, { site_id: "12", site_name: "GAA (Gaas, Balamban, Cebu)" }, { site_id: "13", site_name: "GAM (Gamut, Tago, Surigao del Sur)" }, { site_id: "14", site_name: "HIN (1 & 2, Hinabangan, Samar)" }, { site_id: "15", site_name: "HUM (Humayhumay, Guihulngan City, Negros Oriental)" }, { site_id: "16", site_name: "IME (Imelda, Tarangnan, Samar)" }, { site_id: "17", site_name: "IMU (Immuli, Pidigan, Abra)" }, { site_id: "18", site_name: "INA (Sambag, Inabasan, Maasin, Iloilo)" }, { site_id: "19", site_name: "JOR (Poblacion 1, San Jorge, Samar)" }, { site_id: "20", site_name: "LAB (Labey, Ambuklao, Bokod, Benguet)" }, { site_id: "21", site_name: "LAY (Laygayon, Pinabacdao, Samar)" }, { site_id: "22", site_name: "LIP (Lipanto, St. Bernard, Southern Leyte)" }, { site_id: "23", site_name: "LOO (Looc, Villanueva, Misamis Oriental)" }, { site_id: "24", site_name: "LPA (Lipata, Paranas, Samar)" }, { site_id: "25", site_name: "LTE (Literon, Calbiga, Samar)" }, { site_id: "26", site_name: "LUN (Caianuhan, Lunas, Maasin City, Southern Leyte)" }, { site_id: "27", site_name: "MAG (Magsaysay, Kibawe, Bukidnon)" }, { site_id: "28", site_name: "MAM (Mamuyod, Ambassador, Tublay, Benguet)" }, { site_id: "29", site_name: "MAR (Marirong, Leon, Iloilo)" }, { site_id: "30", site_name: "MCA (Mac-Arthur, Esperanza, Agusan del Sur)" }, { site_id: "31", site_name: "MNG (Dao, Manghulyawon, La Libertad, Negros Oriental)" }, { site_id: "32", site_name: "MSL (Lower Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "33", site_name: "MSU (Upper Mesolong, Sto. Nino, Talaingod, Davao del Norte)" }, { site_id: "34", site_name: "NAG (Nagyubuyuban, San Fernando City, La Union)" }, { site_id: "35", site_name: "NUR (Nurcia, Lanuza, Surigao del Sur)" }, { site_id: "36", site_name: "OSL (Oslao, San Francisco, Surigao del Norte)" }, { site_id: "37", site_name: "PAR (Parasanon, Pinabacdao, Samar)" }, { site_id: "38", site_name: "PEP (Bangi, Pepe, Leon, Iloilo)" }, { site_id: "39", site_name: "PIN (Pinagkamaligan, Calauag, Quezon)" }, { site_id: "40", site_name: "PLA (Mambog, Planas, Guihulngan City, Negros Oriental)" }, { site_id: "41", site_name: "PNG (Pange, Matnog, Sorsogon)" }, { site_id: "42", site_name: "PUG (Longlong, Puguis, La Trinidad, Benguet)" }, { site_id: "43", site_name: "SAG (Antadao, Sagada, Mt. Province)" }, { site_id: "44", site_name: "SIB (Sibajay, Boston, Davao Oriental)" }, { site_id: "45", site_name: "SIN (Sinipsip, Amgaleyguey, Buguias, Benguet)" }, { site_id: "46", site_name: "SUM (Sumalsag, Malitbog, Bukidnon)" }, { site_id: "47", site_name: "TAL (Talahid, Almeria, Biliran)" }, { site_id: "48", site_name: "TGA (Taga, Pinukpuk, Kalinga)" }, { site_id: "49", site_name: "TUE (Tue, Tadian, Mt. Province)" }, { site_id: "50", site_name: "UMI (Umingan, Alimodian, Iloilo)" }];

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
    }
});

class AlertReleaseFormModal extends Component {
    state = {
        data_timestamp: null,
        release_time: null,
        site_id: "",
        reporter_id_ct: "",
        reporter_id_mt: "",
        comments: ""
    };

    changeState = (key, value) => {
        this.setState({ [key]: value });
    }

    handleDateTime = key => value => {
        this.changeState(key, value);
    }

    handleEventChange = key => event => {
        const { value } = event.target;
        this.changeState(key, value);
    }
      
    render () {
        const { classes } = this.props;
        const {
            site_id, data_timestamp, release_time,
            reporter_id_mt, reporter_id_ct, comments
        } = this.state;

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
                            changeHandler={this.handleEventChange("site_id")}
                            value={site_id}
                            list={sites}
                            mapping={{ id: "site_id", label: "site_name" }}
                            css={classes.selectInput}
                        />
                    </Grid>
                       
                    <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                        <KeyboardDateTimePicker
                            required
                            autoOk
                            label="Data Timestamp"
                            value={data_timestamp}
                            onChange={this.handleDateTime("data_timestamp")}
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
                            value={release_time}
                            onChange={this.handleDateTime("release_time")}
                            clearable
                        /> 
                    </Grid>

                    <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                        <DynaslopeUserSelectInputForm
                            variant="standard"
                            label="IOMP-MT"
                            div_id="reporter_id_mt"
                            changeHandler={this.handleEventChange("reporter_id_mt")}
                            value={reporter_id_mt}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                        {/* <SelectInputForm
                            label="IOMP-CT"
                            div_id="reporter_id_ct"
                            changeHandler={this.handleEventChange("reporter_id_ct")}
                            value={reporter_id_ct}
                            list={users}
                            mapping={{ id: "user_id", label: "name" }}
                            // css={classes.selectInput}
                        /> */}
                        <DynaslopeUserSelectInputForm
                            variant="standard"
                            label="IOMP-CT"
                            div_id="reporter_id_ct"
                            changeHandler={this.handleEventChange("reporter_id_ct")}
                            value={reporter_id_ct}
                        />
                    </Grid>

                    <SubsurfaceTriggerGroup />

                    <SurficialTriggerGroup />

                    <RainfallTriggerGroup />

                    <EarthquakeTriggerGroup />

                    <OnDemandTriggerGroup />

                    <Grid item xs={12} className={classes.inputGridContainer}>
                        <TextField
                            label="Comments"
                            multiline
                            rowsMax="2"
                            placeholder="Enter additional comments necessary"
                            value={comments}
                            onChange={this.handleEventChange("comments")}
                            fullWidth
                        />
                    </Grid>

                    {/* <Grid item xs={12} className={classes.inputGridContainer}>
                        <Divider />
                    </Grid> */}
                </Grid>
            </MuiPickersUtilsProvider>      
        );
    }
}

export default withStyles(styles)(AlertReleaseFormModal);
