import React, { 
    Fragment, useState, 
    useEffect, useContext,
    useReducer
} from "react";

import {
    Card, CardContent,
    Grid, Typography, withWidth, Button,
    TextField, Checkbox, Radio, CardActions,
    FormControl, InputLabel, MenuItem,
    Select, FormLabel, FormGroup, FormControlLabel,
    FormHelperText, RadioGroup
} from "@material-ui/core";
import MaskedInput from "react-text-mask";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import { makeStyles } from "@material-ui/core/styles";
import { useSnackbar } from "notistack";

import GeneralStyles from "../../GeneralStyles";
import PageTitle from "../reusables/PageTitle";
import { GeneralContext } from "../contexts/GeneralContext";
import { capitalizeFirstLetter } from "../../UtilityFunctions";
import { saveDeploymentLogs, getLoggersData } from "./ajax";
import LoggersList from "./LoggerList";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 16
        },
        sticky: {
            position: "sticky",
            top: 146,
            [theme.breakpoints.down("sm")]: {
                top: 48
            },
            backgroundColor: "white",
            zIndex: 1
        },
        noFlexGrow: { flexGrow: 0 },
        paper: {
            position: "fixed",
            right: 0,
            top: 116,
            width: 400
        },
        overflow: {
            overflowY: "auto",
            height: "calc(100vh - 250px)",
            [theme.breakpoints.down("md")]: {
                height: "80vh"
            }
        },
        insetDivider: { padding: "8px 70px !important" },
        nested: { paddingLeft: theme.spacing(4) },
        hidden: { display: "none !important" },
        form_message_style: {
            color: "red",
            fontStyle: "italic"
        },
    };

});

const mobile_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];


function TextMaskCustom (props) {
    const { inputRef, mask, ...other } = props;
  
    return (
        <MaskedInput
            {...other}
            ref={ref => {
                inputRef(ref ? ref.inputElement : null);
            }}
            mask={mask} placeholderChar="x"
            showMask
        />
    );
}

function removeMobileNumberMask (mobile_number) {
    const altered = mobile_number.replace(/[()+-\s]/g, "");
    return altered;
}


function TSMForm (props) {
    const { classes, deploymentFormInputs, buttonAction, sites, setOpenTSMForm } = props;
    const { site_code, logger_name, date_installed, date_activated,
        location_description, latitude, longitude, network,
        mobile_number, logger_type, installed_sensors,
        personnels } = deploymentFormInputs;
        
    const formmatted_date_activated = moment(date_activated).format("YYYY-MM-DD");
    const formmatted_date_installed = moment(date_installed).format("YYYY-MM-DD");
    
    const [tsm_form_inputs, setTSMFormInputs] = useState("");
    const [submit_button_state, setSubmitButtonState] = useState(true);
    const [segment_list, setSegmentList] = useState([]);

    const initial_data = {
        tsm_name: logger_name,
        version: "",
        segment_length: "",
        number_of_segment: "",
        segment_list: ""
    };
    const [tsm_data, dispatch] = useReducer(reducerFunction, initial_data, initReducer);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const clearFields = () => {
        dispatch({ type: "RESET", value: initial_data });
    };

    const save_deployment_data = () => {
        deploymentFormInputs.tsm_form_inputs = tsm_form_inputs;
        const site_data = sites.find(o => o.site_code === site_code);
        const { site_id } = site_data;
        deploymentFormInputs.mobile_number = removeMobileNumberMask(deploymentFormInputs.mobile_number);
        const update_data = {
            ...deploymentFormInputs,
            tsm_form_inputs, 
            site_id
        };
        
        saveDeploymentLogs(update_data, data => {
            const { status, message } = data;
            let variant;
            if (status) {
                setOpenTSMForm(false);
                clearFields();
                variant = "success";
            } else {
                variant = "error";
            }

            enqueueSnackbar(
                message,
                {
                    variant,
                    autoHideDuration: 5000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const handleNumberOfSegmentInput = (event) => {
        const { value } = event.target;
        dispatch({ type: "UPDATE", field: "number_of_segment", value });
        const temp_data = [];
        let i;
        for (i = 0; i < value; i += 1) {
            const temp_value = i + 1;
            temp_data.push({ segment_value: temp_value, node_id: temp_value });
        }
        setSegmentList(temp_data);
        dispatch({ type: "UPDATE", field: "segment_list", value: temp_data });
    };

    const handleSegmentInput = (event, index) => {
        let { value } = event;
        if (value === "NaN") value = 0;
        const temp = [...segment_list];
        temp[index] = { segment_value: parseInt(value, 10), node_id: temp[index].node_id };
        setSegmentList(temp);
        dispatch({ type: "UPDATE", field: "segment_list", value: temp });
    };

    useEffect(() => {
        const is_disable_save = Object.keys(tsm_data).some(key => {
            const { required, helper_text } = tsm_data[key];
            return required && helper_text !== "" && helper_text !== null;
        });
        setSubmitButtonState(is_disable_save);
        setTSMFormInputs(sanitizeData(tsm_data));
    }, [tsm_data]);
   
    return (
        <Card className={classes.root}>
            <CardContent>
                <Grid 
                    container
                    spacing={2}
                >
                    <Grid item xs={12} container>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Site code:</b> {site_code.toUpperCase()}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Logger name:</b>  {logger_name}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Date installed:</b>  {formmatted_date_installed}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Date activated:</b>  {formmatted_date_activated}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2">
                                <b>Location description:</b>  {capitalizeFirstLetter(location_description)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Latitude:</b>  {latitude}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Longitude:</b>  {longitude}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Mobile number:</b> {mobile_number}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Network:</b>  {capitalizeFirstLetter(network)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Logger type:</b>  {capitalizeFirstLetter(logger_type)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">
                                <b>Installed sensors:</b>  {installed_sensors.join(", ")}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2">
                                <b>Personnels:</b>  {personnels.join(", ")}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                label="TSM Name"
                                value={tsm_data.tsm_name.value}
                                disabled
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                label="Version"
                                value={tsm_data.version.value}
                                type="number"
                                onChange={e => dispatch({ type: "UPDATE", field: "version", value: e.target.value })}
                                helperText={tsm_data.version.helper_text || ""}
                                error={Boolean(tsm_data.version.helper_text)}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                label="Segment Length"
                                value={tsm_data.segment_length.value}
                                type="number"
                                onChange={e => dispatch({ type: "UPDATE", field: "segment_length", value: e.target.value })}
                                helperText={tsm_data.segment_length.helper_text || ""}
                                error={Boolean(tsm_data.segment_length.helper_text)}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                label="Number of Segment"
                                value={tsm_data.number_of_segment.value}
                                type="number"
                                onChange={event => handleNumberOfSegmentInput(event)}
                                helperText={tsm_data.number_of_segment.helper_text || ""}
                                error={Boolean(tsm_data.number_of_segment.helper_text)}
                            />
                        </FormControl>
                    </Grid>
                    {
                        segment_list.length !== 0 && (
                            <Grid item xs={12}>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Segments
                                </Typography>
                            </Grid>
                        )
                    }

                    {
                        segment_list.length !== 0 && (
                            segment_list.map((item, i) => (
                                <Grid item xs={6} key={`segment_container_${i + 1}`}>
                                    <FormControl fullWidth>
                                        <TextField
                                            label={`Segment ${i + 1}`}
                                            key={`segment_${i + 1}`}
                                            value={item.segment_value}
                                            onChange={event => handleSegmentInput(event.target, i)}
                                            type="number"
                                        />
                                    </FormControl>
                                </Grid>
                            ))
                        )
                    }
                </Grid>
            </CardContent>
            <CardActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={buttonAction}>
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={submit_button_state}
                    onClick={save_deployment_data}>
                    Save
                </Button>
                <Button size="small" onClick={clearFields}>Clear</Button>
            </CardActions>
        </Card>
    );
}

function getHelperText (field, value) {
    if (value === "") return "Required field";

    if (field === "mobile_number") {
        const is_invalid = value.includes("x");
        if (is_invalid) return "Invalid number format";
    }
    
    if (field === "version" || field === "segment_length" || field === "number_of_segment") {
        if (value === 0 || value === "0") return "Invalid value";
    }

    if (field === "segment_list") {
        const check_segment_value = Object.keys(value).some(key => {
            const { segment_value } = value[key];
            return segment_value === "";
        });

        if (check_segment_value) return "Invalid segment value inserted";
    }
    return "";
}

function reducerFunction (state, action) {
    const { type, field, value } = action;
    const field_value = state[field];
    const new_value = value;
    const new_helper_text = getHelperText(field, value);
    const reset_data = initReducer(new_value);

    switch (type) {
        case "UPDATE":
            return { ...state, [field]: {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            } };
        case "RESET":
            return { ...reset_data };
        default:
            return { ...state };
    }
}


function initReducer (data) {
    const new_data = {};
    Object.keys(data).forEach(key => {
        const field = new_data[key];
        const new_helper_text = getHelperText(field, data[key]);
        new_data[key] = {
            value: data[key],
            helper_text: new_helper_text,
            required: true
        };
    });

    return new_data;
}

function sanitizeData (data) {
    const clean_data = {};
    Object.keys(data).forEach(key => {
        clean_data[key] = data[key].value;
    });

    return clean_data;
}

function DeploymentFormContainer (props) {
    const classes = useStyles();
    const { sites } = useContext(GeneralContext);
    const personnels_list = [
        "brain", "kate", "sky",
        "jec", "kennex", "reyn",
        "web", "oscar", "dan",
        "arnel", "troy"
    ];
    const [installed_sensors, setInstalledSensors] = useState([]);
    const [personnels, setPersonnels] = useState([]);
    const [open_tsm_form, setOpenTSMForm] = useState(false);
    const [submit_button_state, setSubmitButtonState] = useState(true);
    const [submit_button_text, setSubmitButtonText] = useState("Submit");
    const [deployment_form_inputs, setDeploymentFormInputs] = useState(null);
    const update_date_installed = value => dispatch({ type: "UPDATE", field: "date_installed", value: moment(value).format("YYYY-MM-DD") });
    const update_date_activated = value => dispatch({ type: "UPDATE", field: "date_activated", value: moment(value).format("YYYY-MM-DD") });
    const current_date_time = moment().format("YYYY-MM-DD");
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [loggers, setLoggers] = useState([]);
    const [rainfall_gauges, setRainfallGauges] = useState([]);
    
    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const sensors_initial_state = {
        tilt: false,
        rain: false,
        piezo: false,
        soms: false,
    };
    const initial_data = {
        site_code: "", 
        logger_name: "",
        date_installed: current_date_time,
        date_activated: current_date_time,
        location_description: "",
        latitude: "",
        longitude: "",
        network: "",
        mobile_number: "",
        logger_type: "",
        installed_sensors: sensors_initial_state,
        installed_sensors_state: sensors_initial_state,
        personnels: ""
    };
    const [deployment_data, dispatch] = useReducer(reducerFunction, initial_data, initReducer);
    const [installed_sensors_state, setInstalledSensorsState] = useState(sensors_initial_state);
    
    const clearFields = () => {
        dispatch({ type: "RESET", value: initial_data });
    };

    const buttonAction = () => {

        const sensors_checker = installed_sensors.includes("Tilt");
        if (sensors_checker) setOpenTSMForm(!open_tsm_form);
        else save_deployment_data();
    };

    const save_deployment_data = () => {
        const site_data = sites.find(o => o.site_code === deployment_data.site_code.value);
        const { site_id } = site_data;
        deployment_form_inputs.mobile_number = removeMobileNumberMask(deployment_form_inputs.mobile_number);
        const updated_data = {
            ...deployment_form_inputs,
            site_id
        };
        
        setDeploymentFormInputs(updated_data);
        saveDeploymentLogs(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status) {
                setOpenTSMForm(false);
                clearFields();
                variant = "success";
            } else {
                variant = "error";
            }

            enqueueSnackbar(
                message,
                {
                    variant,
                    autoHideDuration: 5000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const sensorsHandleChange = (event) => {
        const { name, checked } = event.target;
        setInstalledSensorsState({ ...installed_sensors_state, [event.target.name]: event.target.checked });
        const temp_sensors = [...installed_sensors];
        dispatch({ type: "UPDATE", field: "installed_sensors_state", value: { ...installed_sensors_state, [event.target.name]: event.target.checked } });
        if (!checked) {
            const array_index = temp_sensors.indexOf(capitalizeFirstLetter(name));
            temp_sensors.splice(array_index, 1);
        } else {
            temp_sensors.push(capitalizeFirstLetter(name));
        }
        setInstalledSensors(temp_sensors);
        dispatch({ type: "UPDATE", field: "installed_sensors", value: temp_sensors });
    };

    const personnelsHandleChange = (event) => {
        const { name, checked } = event.target;
        const temp_personnels = [...personnels];

        if (!checked) {
            const array_index = temp_personnels.indexOf(capitalizeFirstLetter(name));
            temp_personnels.splice(array_index, 1);
        } else {
            temp_personnels.push(capitalizeFirstLetter(name));
        }

        dispatch({ type: "UPDATE", field: "personnels", value: temp_personnels });
        setPersonnels(temp_personnels);
    };

    useEffect(() => {
        const is_disable_save = Object.keys(deployment_data).some(key => {
            const { required, helper_text } = deployment_data[key];
            return required && helper_text !== "" && helper_text !== null;
        });
        console.log("is_disable_save", is_disable_save);
        setSubmitButtonState(is_disable_save);
        const sensors_checker = installed_sensors.includes("Tilt");
        if (sensors_checker) setSubmitButtonText("Next");
        else setSubmitButtonText("Submit");
        setDeploymentFormInputs(sanitizeData(deployment_data));
    }, [deployment_data]);

    useEffect(() => {
        getLoggersData(data => {
            const { loggers: loggers_data, rain_gauges } = data;
            console.log(data);
            setLoggers(loggers_data);
            setRainfallGauges(rain_gauges);
        });
    }, []);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Data Loggers and Sensors Settings"
                    className={classes.sticky}
                />
                <Grid
                    container
                    spacing={1} 
                    justify="space-evenly">
                    <Grid item xs={6} className={classes.sticky}>
                        {
                            !open_tsm_form && (
                                <Card className={classes.root}>
                                    <CardContent>
                                        <Grid 
                                            container
                                            spacing={2} 
                                            justify="space-evenly"
                                        >
                                            <Grid item xs={6}>
                                                <FormControl required fullWidth>
                                                    <InputLabel id="site-code">Site Code</InputLabel>
                                                    <Select
                                                        labelId="site-code-select-label"
                                                        id="site-code-select-id"
                                                        value={deployment_data.site_code.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "site_code", value: e.target.value })}
                                                        error={Boolean(deployment_data.site_code.helper_text)}
                                                    >
                                                        <MenuItem value="">
                                                            <em>None</em>
                                                        </MenuItem>
                                                        {
                                                            sites.map((item, i) => (
                                                                <MenuItem value={item.site_code} key={i}>{item.site_code.toUpperCase()}</MenuItem>
                                                            ))
                                                        }
                                                    </Select>
                                                    <FormHelperText error>{deployment_data.site_code.helper_text}</FormHelperText>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Logger Name"
                                                        value={deployment_data.logger_name.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "logger_name", value: e.target.value })}
                                                        helperText={deployment_data.logger_name.helper_text || ""}
                                                        error={Boolean(deployment_data.logger_name.helper_text)}
                                                    />
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                                        <Grid item xs={12}>
                                                            <KeyboardDateTimePicker
                                                                required
                                                                autoOk
                                                                label="Date Installed"
                                                                value={deployment_data.date_installed.value || current_date_time}
                                                                onChange={update_date_installed}
                                                                ampm={false}
                                                                placeholder="2010/01/01"
                                                                format="YYYY/MM/DD"
                                                                mask="__/__/____"
                                                                clearable
                                                                disableFuture
                                                            />
                                                        </Grid>
                                                    </MuiPickersUtilsProvider>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                                        <Grid item xs={12}>
                                                            <KeyboardDateTimePicker
                                                                required
                                                                autoOk
                                                                label="Date Activated"
                                                                value={deployment_data.date_activated.value || current_date_time}
                                                                onChange={update_date_activated}
                                                                ampm={false}
                                                                placeholder="2010/01/01"
                                                                format="YYYY/MM/DD"
                                                                mask="__/__/____"
                                                                clearable
                                                                disableFuture
                                                            />
                                                        </Grid>
                                                    </MuiPickersUtilsProvider>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Location Description"
                                                        value={deployment_data.location_description.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "location_description", value: e.target.value })}
                                                        helperText={deployment_data.location_description.helper_text || ""}
                                                        error={Boolean(deployment_data.location_description.helper_text)}
                                                    />
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Latitude"
                                                        value={deployment_data.latitude.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "latitude", value: e.target.value })}
                                                        type="number"
                                                        helperText={deployment_data.latitude.helper_text || ""}
                                                        error={Boolean(deployment_data.latitude.helper_text)}
                                                    />
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Longitude"
                                                        value={deployment_data.longitude.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "longitude", value: e.target.value })}
                                                        type="number"
                                                        helperText={deployment_data.longitude.helper_text || ""}
                                                        error={Boolean(deployment_data.longitude.helper_text)}
                                                    />
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl required fullWidth>
                                                    <InputLabel id="network">Network</InputLabel>
                                                    <Select
                                                        labelId="network-select-label"
                                                        id="network-select-id"
                                                        value={deployment_data.network.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "network", value: e.target.value })}
                                                        error={Boolean(deployment_data.network.helper_text)}
                                                    >
                                                        <MenuItem value="">
                                                            <em>None</em>
                                                        </MenuItem>
                                                
                                                        <MenuItem value="Globe" key="globe">Globe</MenuItem>
                                                        <MenuItem value="Smart" key="smart">Smart</MenuItem>
                                                    </Select>
                                                    <FormHelperText error>{deployment_data.network.helper_text}</FormHelperText>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Mobile Number"
                                                        value={deployment_data.mobile_number.value}
                                                        onChange={e => dispatch({ type: "UPDATE", field: "mobile_number", value: e.target.value })}
                                                        InputProps={{
                                                            inputComponent: TextMaskCustom,
                                                            inputProps: { mask: mobile_number_mask }
                                                        }}
                                                        helperText={deployment_data.mobile_number.helper_text || ""}
                                                        error={Boolean(deployment_data.mobile_number.helper_text)}
                                                    />
                                                </FormControl>
                                            </Grid>
                                            <Grid item container xs={12}>
                                                <Grid 
                                                    container
                                                    spacing={2}
                                                    justify="space-evenly"
                                                >
                                                    <FormControl component="fieldset" className={classes.formControl}>
                                                        <FormLabel component="legend">Logger Type</FormLabel>
                                                        <RadioGroup
                                                            row
                                                            aria-label="logger_type_group"
                                                            name="logger_type"
                                                            value={deployment_data.logger_type.value}
                                                            onChange={e => dispatch({ type: "UPDATE", field: "logger_type", value: e.target.value })}
                                                        >
                                               
                                                            <FormControlLabel
                                                                value="masterbox"
                                                                control={<Radio color="primary"/>}
                                                                label="Master Box"
                                                                key="master_box" />
                                                            <FormControlLabel
                                                                value="arq"
                                                                control={<Radio color="primary"/>}
                                                                label="ARQ"
                                                                key="arq" />
                                                            <FormControlLabel
                                                                value="router"
                                                                control={<Radio color="primary"/>}
                                                                label="Router"
                                                                key="router" />
                                                            <FormControlLabel
                                                                value="gateway"
                                                                control={<Radio color="primary"/>}
                                                                label="Gateway"
                                                                key="gateway" />
                                                        
                                                        </RadioGroup>
                                                        <FormHelperText error>{deployment_data.logger_type.helper_text}</FormHelperText>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                            <Grid item container xs={12}>
                                                <Grid 
                                                    container
                                                    spacing={2}
                                                    justify="space-evenly"
                                                >
                                                    <FormControl component="fieldset" className={classes.formControl}>
                                                        <FormLabel component="legend">Installed sensors</FormLabel>
                                                        <FormGroup>
                                                            <Grid 
                                                                container
                                                                spacing={2} 
                                                                justify="space-evenly"
                                                            >
                                                                <FormControlLabel
                                                                    control={<Checkbox checked={deployment_data.installed_sensors_state.value.tilt} name="tilt" onChange={sensorsHandleChange}/>}
                                                                    label="Tilt"
                                                                />
                                                                <FormControlLabel
                                                                    control={<Checkbox checked={deployment_data.installed_sensors_state.value.rain} name="rain" onChange={sensorsHandleChange}/>}
                                                                    label="Rain"
                                                                />
                                                                <FormControlLabel
                                                                    control={<Checkbox checked={deployment_data.installed_sensors_state.value.piezo} name="piezo" onChange={sensorsHandleChange}/>}
                                                                    label="Piezo"
                                                                />
                                                                <FormControlLabel
                                                                    control={<Checkbox checked={deployment_data.installed_sensors_state.value.soms} name="soms" onChange={sensorsHandleChange}/>}
                                                                    label="Soms"
                                                                />
                                                            </Grid>
                                                        </FormGroup>
                                                        <FormHelperText>Select at least one.</FormHelperText>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                            <Grid item container xs={12}>
                                                <Grid 
                                                    container
                                                    spacing={2}
                                                    justify="space-evenly"
                                                >
                                                    <FormControl component="fieldset" className={classes.formControl}>
                                                        <FormLabel component="legend">Personnels</FormLabel>
                                                        <FormGroup>
                                                            <Grid 
                                                                container
                                                                spacing={2} 
                                                                justify="space-evenly"
                                                            >
                                                                {
                                                                    personnels_list.map((item, i) => (
                                                                        <FormControlLabel
                                                                            onChange={personnelsHandleChange}
                                                                            key={i}
                                                                            control={<Checkbox name={item} />}
                                                                            label={`${capitalizeFirstLetter(item)}`}
                                                                        />
                                                                    ))
                                                                }
                                                            </Grid>
                                                        </FormGroup>
                                                        <FormHelperText>Select at least one.</FormHelperText>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={buttonAction}
                                            disabled={submit_button_state}>
                                            {submit_button_text}
                                        </Button>
                                        <Button size="small" onClick={clearFields}>Clear</Button>
                                    </CardActions>
                                </Card> 
                            )
                            
                        }

                        {
                            open_tsm_form && (
                                <TSMForm
                                    classes={classes}
                                    deploymentFormInputs={deployment_form_inputs}
                                    buttonAction={buttonAction}
                                    sites={sites}
                                    setOpenTSMForm={setOpenTSMForm}
                                />
                            )
                        }
                    </Grid>
                    <Grid item xs={6}>

                        <Card className={classes.root}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Loggers
                                </Typography>
                                {
                                    loggers.length !== 0 && (
                                        loggers.map((row, index) => {
                                            const { logger_name } = row;
                                            let temp_rain_gauge = null;
                                            const check_rain_gauge = rainfall_gauges.find(x => x.gauge_name === logger_name);

                                            if (check_rain_gauge) {
                                                temp_rain_gauge = check_rain_gauge;
                                            }

                                            return (
                                                <LoggersList
                                                    loggerData={row}
                                                    key={index}
                                                    rain_gauge={temp_rain_gauge}
                                                />
                                            );
                                        }) 
                                    )
                                }
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>
            
            
        </Fragment>
    );
}

export default withWidth()(DeploymentFormContainer);