import React, { useState, useEffect, useReducer } from "react";

import {
    Card, CardContent,
    Grid, Typography, Button,
    TextField, Checkbox, Radio,
    FormControl, InputLabel, MenuItem,
    Select, FormLabel, FormGroup, FormControlLabel,
    FormHelperText, RadioGroup, Divider
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";

import MaskedInput from "react-text-mask";
import moment from "moment";
import { useSnackbar } from "notistack";

import TiltForm from "./TiltForm";
import { saveLoggerDeployment } from "../ajax";

import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";

const logger_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];

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

function removeMobileNumberMask (logger_number) {
    const altered = logger_number.replace(/[()+-\s]/g, "");
    return altered;
}

function sanitizeData (data) {
    const get_value = obj => {
        return Object.keys(obj).reduce((bank, key) => {
            const temp_bank = { ...bank };
            const { value } = obj[key];
            let temp_value = value;
    
            if (typeof value === "undefined") {
                temp_value = get_value(obj[key]);
            }
            
            if (value === "") {
                temp_value = null;
            } 
            
            if (key === "logger_number") {
                temp_value = removeMobileNumberMask(value);
            }

            if (key === "site") {
                temp_value = value.data;
            }

            if (moment.isMoment(value)) {
                temp_value = value.format("YYYY-MM-DD");
            }
    
            temp_bank[key] = temp_value;
            return temp_bank;
        }, {});
    };

    const clean_data = get_value(data);
    return clean_data;
}

function getHelperText (field, value, required) {
    if (value === "" && required) return "Required field";

    if (field === "logger_number") {
        if (value.includes("x")) return "Enter complete mobile number";
    }

    if (["date_installed", "date_activated"].includes(field)) {
        if (value !== null && !value.isValid()) return "Enter a valid date";
    }

    if (["installed_sensors", "personnel"].includes(field)) {
        if (value.length === 0) return true;
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
    let field_value = state[field];

    let new_value = value;
    let test_helper_value = value;
    if (["installed_sensors", "personnel"].includes(field)) {
        const { name, checked } = value;
        const { value: val } = field_value;
        if (checked) {
            val.push(name);
            new_value = val;
        } else {
            new_value = val.filter(x => x !== name);
        }

        test_helper_value = new_value;
    }
    
    try {
        // only UPDATE_SENSOR will enter this
        if (field === "tilt") {
            const { tilt_data, test_value } = value;
            new_value = tilt_data;
            test_helper_value = test_value;
        }

        const { sensor } = value;
        if (state.installed_sensors.value.includes(sensor)) {
            const { data } = value;
            new_value = data;
            test_helper_value = data;
            field_value = state[sensor][field];
        }
    } catch (error) {
        // sensor checkboxes will enter this from DELETE_ATTRIBUTE
    }

    let required = false;
    try {
        const { required: r } = field_value;
        required = r;
    } catch (error) {
        // sensor checkboxes will enter this from ADD_ATTRIBUTE
    }

    const new_helper_text = getHelperText(field, test_helper_value, required);

    switch (type) {
        case "UPDATE":
            return { ...state, [field]: {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            } };
        case "ADD_ATTRIBUTE":
            return { ...state, [field]: value };
        case "UPDATE_SENSOR":
            // eslint-disable-next-line no-case-declarations
            const { sensor } = value;
            return { ...state, [sensor]: {
                [field]: {
                    ...field_value,
                    value: new_value,
                    helper_text: new_helper_text
                }
            } };
        case "UPDATE_TILT":
            return { ...state, [field]: {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            } };
        case "DELETE_ATTRIBUTE":
            // eslint-disable-next-line no-param-reassign
            delete state[field];
            return state;
        case "RESET":
            // eslint-disable-next-line no-case-declarations
            const reset_data = initReducer(new_value);
            return { ...reset_data };
        default:
            return { ...state };
    }
}

function initReducer (data) {
    const new_data = {};
    const not_required_list = ["date_activated"];
    Object.keys(data).forEach(key => {
        const new_helper_text = null;
        const required = !not_required_list.includes(key);
        new_data[key] = {
            value: data[key],
            helper_text: new_helper_text,
            required
        };
    });

    return new_data;
}

const personnel_list = [
    "brain", "kate", "sky",
    "jec", "kennex", "reyn",
    "web", "oscar", "dan",
    "arnel", "troy"
];

function AddLoggerForm (props) {
    const { setIsAddLogger, setReloadList } = props;
    const initial_data = {
        site: "", 
        logger_name: "",
        date_installed: null,
        latitude: "",
        longitude: "",
        location_description: "",
        network: "",
        logger_number: "",
        logger_type: "",
        installed_sensors: [],
        personnel: []
    };

    const [deployment_data, dispatch] = useReducer(reducerFunction, initial_data, initReducer);
    const [is_submit_disabled, setIsSubmitDisabled] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const clearFields = () => dispatch({ type: "RESET", value: initial_data });

    const checkCheckbox = (field, value) => deployment_data[field].value.includes(value);
    const onCheckboxChange = field => e => {
        const { name, checked } = e.target;
        dispatch({ type: "UPDATE", field, value: { name, checked } });

        if (field === "installed_sensors") {
            if (checked) {
                let add_data = initReducer({ date_activated: null });
                if (name === "tilt") add_data = { required: true, helper_text: null, value: null };

                dispatch({ type: "ADD_ATTRIBUTE", field: name, value: add_data });
            } else {
                dispatch({ type: "DELETE_ATTRIBUTE", field: name });
            }
        }
    };

    const onTiltFormUpdate = (tilt_data, has_error) => {
        const value = { test_value: !has_error || "", tilt_data };
        dispatch({ type: "UPDATE_TILT", field: "tilt", value });
    };

    const checkInputFields = obj => {
        return Object.keys(obj).some(key => {
            const { required, helper_text } = obj[key];

            if (typeof required === "undefined") {
                return checkInputFields(obj[key]);
            }

            return (
                required && (helper_text !== "" || helper_text === null) ||
                (!required && (helper_text !== "" && helper_text !== null))
            );
        });
    };

    useEffect(() => {
        const { logger_type } = deployment_data;
        const { value: type } = logger_type;
        
        if (type === "router"){
            deployment_data.logger_number = {required: false, helper_text: "", value: "has_value"}
            deployment_data.network = {required: false, helper_text: "", value: "has_value"}
        }
        
        const isd = checkInputFields(deployment_data);
        setIsSubmitDisabled(isd);
    }, [deployment_data]);

    const save_deployment_data = () => {
        const cleaned_data = sanitizeData(deployment_data);
        cleaned_data.date_installed = moment(cleaned_data.date_installed).format("YYYY-MM-DD");
        const { installed_sensors } = cleaned_data;

        if (installed_sensors.includes("tilt")) {
            cleaned_data.tilt.date_activated = moment(cleaned_data.tilt.date_activated).format("YYYY-MM-DD");
        }
        
        console.log(cleaned_data);
        saveLoggerDeployment(cleaned_data, data => {
            const { status, message } = data;
            let variant;
            if (status) {
                variant = "success";
                setIsAddLogger(false);
                setReloadList(true);
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

    return (
        <Grid container spacing={2} justify="space-evenly">
            <Typography
                component={Grid}
                item xs={12}
                variant="h6"
            >
                <strong>Logger Deployment Form</strong>
            </Typography>

            <Grid item xs={12}><Card variant="outlined"><CardContent component={Grid} container spacing={2}>
                <Grid item xs={6} lg={4}>
                    <DynaslopeSiteSelectInputForm
                        required
                        value={deployment_data.site.value}
                        changeHandler={value => dispatch({ type: "UPDATE", field: "site", value })}
                    />  
                </Grid>
            
                <Grid item xs={6} lg={4}>
                    <TextField
                        required
                        fullWidth
                        label="Logger Name"
                        value={deployment_data.logger_name.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "logger_name", value: e.target.value })}
                        helperText={deployment_data.logger_name.helper_text || ""}
                        error={Boolean(deployment_data.logger_name.helper_text)}
                    />
                </Grid>
                {
                    deployment_data.logger_type.value !== "router" && (
                        <Grid item xs={6} lg={4}>
                            <TextField
                                required
                                fullWidth
                                label="Logger Number"
                                InputProps={{
                                    inputComponent: TextMaskCustom,
                                    inputProps: { mask: logger_number_mask }
                                }}
                                InputLabelProps={{ shrink: true }}
                                value={deployment_data.logger_number.value}
                                onChange={e => dispatch({ type: "UPDATE", field: "logger_number", value: e.target.value })}
                                helperText={deployment_data.logger_number.helper_text || ""}
                                error={Boolean(deployment_data.logger_number.helper_text)}
                            />
                        </Grid>
                    )
                }

                <MuiPickersUtilsProvider utils={MomentUtils}>
                    <Grid item xs={6} lg={4}>
                        <KeyboardDatePicker
                            required
                            autoOk
                            label="Date Installed"
                            value={deployment_data.date_installed.value || null}
                            onChange={e => dispatch({ type: "UPDATE", field: "date_installed", value: e })}
                            helperText={deployment_data.date_installed.helper_text || ""}
                            error={Boolean(deployment_data.date_installed.helper_text)}
                            ampm={false}
                            placeholder="2010/01/01"
                            format="YYYY/MM/DD"
                            mask="____/__/__"
                            clearable
                            disableFuture
                            fullWidth
                        />
                    </Grid>
                </MuiPickersUtilsProvider>

                <Grid item xs={6} lg={4}>
                    <TextField
                        fullWidth
                        required
                        label="Latitude"
                        type="number"
                        value={deployment_data.latitude.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "latitude", value: e.target.value })}
                        helperText={deployment_data.latitude.helper_text || ""}
                        error={Boolean(deployment_data.latitude.helper_text)}
                    />
                </Grid>

                <Grid item xs={6} lg={4}>
                    <TextField
                        fullWidth
                        required
                        label="Longitude"
                        type="number"
                        value={deployment_data.longitude.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "longitude", value: e.target.value })}
                        helperText={deployment_data.longitude.helper_text || ""}
                        error={Boolean(deployment_data.longitude.helper_text)}
                    />
                </Grid>
                {
                    deployment_data.logger_type.value !== "router" && (
                        <Grid item xs={12} sm={6} md={5} lg={3}>
                            <FormControl required fullWidth error={Boolean(deployment_data.network.helper_text)}>
                                <InputLabel id="network">Main Network of Location</InputLabel>
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
                    )
                }

                <Grid item xs={12} sm={6} md={7} lg={9}>
                    <TextField
                        fullWidth
                        required
                        label="Location Description"
                        value={deployment_data.location_description.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "location_description", value: e.target.value })}
                        helperText={deployment_data.location_description.helper_text || ""}
                        error={Boolean(deployment_data.location_description.helper_text)}
                    />
                </Grid>

                <Grid item xs={12}><Divider style={{ margin: "8px 0" }}/></Grid>

                <FormControl
                    component={Grid}
                    item xs={12} lg={6} container
                    alignItems="center"
                >
                    <FormLabel component="legend" required>Logger Type</FormLabel>
                    <RadioGroup
                        row
                        aria-label="logger_type_group"
                        name="logger_type"
                        value={deployment_data.logger_type.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "logger_type", value: e.target.value })}
                        style={{ justifyContent: "center" }}
                    >              
                        <FormControlLabel
                            value="masterbox"
                            control={<Radio color="primary"/>}
                            label="Master Box"
                            key="master_box"
                        />
                        <FormControlLabel
                            value="arq"
                            control={<Radio color="primary"/>}
                            label="ARQ"
                            key="arq"
                        />
                        <FormControlLabel
                            value="router"
                            control={<Radio color="primary"/>}
                            label="Router"
                            key="router"
                        />
                        <FormControlLabel
                            value="gateway"
                            control={<Radio color="primary"/>}
                            label="Gateway"
                            key="gateway"
                        />                                 
                    </RadioGroup>
                    {/* <FormHelperText error>{deployment_data.logger_type.helper_text}</FormHelperText> */}
                </FormControl>

                <FormControl
                    component={Grid}
                    item xs={12} lg={6} container
                    alignItems="center"
                    error={Boolean(deployment_data.installed_sensors.helper_text)}
                >
                    <FormLabel component="legend" required>Installed Sensors</FormLabel>
                    <FormGroup row style={{ justifyContent: "center" }}>
                        <FormControlLabel
                            control={<Checkbox
                                name="rain" 
                                checked={checkCheckbox("installed_sensors", "rain")}
                                onChange={onCheckboxChange("installed_sensors")}
                            />}
                            label="Rain"
                        />
                        <FormControlLabel
                            control={<Checkbox
                                name="tilt"
                                checked={checkCheckbox("installed_sensors", "tilt")}
                                onChange={onCheckboxChange("installed_sensors")}
                            />}
                            label="Tilt"
                        />
                        <FormControlLabel
                            control={<Checkbox
                                name="piezo"
                                checked={checkCheckbox("installed_sensors", "piezo")}
                                onChange={onCheckboxChange("installed_sensors")}
                            />}
                            label="Piezometer"
                        />
                        <FormControlLabel
                            control={<Checkbox
                                name="soms"
                                checked={checkCheckbox("installed_sensors", "soms")}
                                onChange={onCheckboxChange("installed_sensors")}
                            />}
                            label="Soil Moisture"
                        />
                    </FormGroup>
                    {
                        deployment_data.installed_sensors.helper_text && <FormHelperText>
                            Select at least one
                        </FormHelperText>
                    }
                </FormControl>

                <FormControl
                    component={Grid}
                    item xs={12} container
                    alignItems="center"
                    error={Boolean(deployment_data.personnel.helper_text)}
                >
                    <FormLabel component="legend" required>Personnel</FormLabel>
                    <FormGroup row style={{ justifyContent: "center" }}>
                        {
                            personnel_list.map(row => (
                                <FormControlLabel
                                    key={row}
                                    control={<Checkbox
                                        name={row}
                                        checked={checkCheckbox("personnel", row)}
                                        onChange={onCheckboxChange("personnel")}
                                    />}
                                    label={`${capitalizeFirstLetter(row)}`}
                                />
                            ))
                        }
                    </FormGroup>
                    {
                        deployment_data.personnel.helper_text && <FormHelperText>
                            Select at least one
                        </FormHelperText>
                    }
                </FormControl>

            </CardContent></Card></Grid>

            {
                deployment_data.installed_sensors.value.includes("rain") && <Grid item xs={12} md={4}>
                    <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
                        <Typography variant="h6" display="block" component={Grid} item xs={12}>
                            <strong>Rain Gauge</strong>
                        </Typography>

                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Grid item xs={12}>
                                <KeyboardDatePicker
                                    autoOk
                                    label="Date Activated"
                                    value={deployment_data.rain.date_activated.value || null}
                                    onChange={e => dispatch({ type: "UPDATE_SENSOR", field: "date_activated", value: { data: e, sensor: "rain" } })}
                                    helperText={deployment_data.rain.date_activated.helper_text || ""}
                                    error={Boolean(deployment_data.rain.date_activated.helper_text)}
                                    ampm={false}
                                    placeholder="2010/01/01"
                                    format="YYYY/MM/DD"
                                    mask="____/__/__"
                                    clearable
                                    disableFuture
                                    fullWidth
                                />
                            </Grid> 
                        </MuiPickersUtilsProvider>
                    </CardContent></Card>
                </Grid>
            }

            {
                deployment_data.installed_sensors.value.includes("piezo") && <Grid item xs={12} md={4}>
                    <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
                        <Typography variant="h6" display="block" component={Grid} item xs={12}>
                            <strong>Piezometer</strong>
                        </Typography>

                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Grid item xs={12}>
                                <KeyboardDatePicker
                                    autoOk
                                    label="Date Activated"
                                    value={deployment_data.piezo.date_activated.value || null}
                                    onChange={e => dispatch({ type: "UPDATE_SENSOR", field: "date_activated", value: { data: e, sensor: "piezo" } })}
                                    helperText={deployment_data.piezo.date_activated.helper_text || ""}
                                    error={Boolean(deployment_data.piezo.date_activated.helper_text)}
                                    ampm={false}
                                    placeholder="2010/01/01"
                                    format="YYYY/MM/DD"
                                    mask="____/__/__"
                                    clearable
                                    disableFuture
                                    fullWidth
                                />
                            </Grid> 
                        </MuiPickersUtilsProvider>
                    </CardContent></Card>
                </Grid>
            }

            {
                deployment_data.installed_sensors.value.includes("soms") && <Grid item xs={12} md={4}>
                    <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
                        <Typography variant="h6" display="block" component={Grid} item xs={12}>
                            <strong>Soil Moisture</strong>
                        </Typography>

                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Grid item xs={12}>
                                <KeyboardDatePicker
                                    autoOk
                                    label="Date Activated"
                                    value={deployment_data.soms.date_activated.value || null}
                                    onChange={e => dispatch({ type: "UPDATE_SENSOR", field: "date_activated", value: { data: e, sensor: "soms" } })}
                                    helperText={deployment_data.soms.date_activated.helper_text || ""}
                                    error={Boolean(deployment_data.soms.date_activated.helper_text)}
                                    ampm={false}
                                    placeholder="2010/01/01"
                                    format="YYYY/MM/DD"
                                    mask="____/__/__"
                                    clearable
                                    disableFuture
                                    fullWidth
                                />
                            </Grid> 
                        </MuiPickersUtilsProvider>
                    </CardContent></Card>
                </Grid>
            }

            {
                deployment_data.installed_sensors.value.includes("tilt") && <Grid item xs={12}>
                    <TiltForm
                        onTiltFormUpdate={onTiltFormUpdate}
                        initReducer={initReducer}
                        getHelperText={getHelperText}
                        checkInputFields={checkInputFields}
                    />
                </Grid>
            }

            <Grid item xs={12} container justify="flex-end">
                <Button
                    color="primary"
                    onClick={e => setIsAddLogger(false)}
                >
                    Cancel
                </Button>
                
                <Button
                    color="primary"
                    onClick={e => clearFields()}
                >
                    Clear
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    style={{ marginRight: 8 }}
                    onClick={save_deployment_data}
                    disabled={is_submit_disabled}
                >
                    Submit
                </Button>
            </Grid>
        </Grid>
    );
}

export default AddLoggerForm;