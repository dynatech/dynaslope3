import React, { 
    Fragment, useState, useEffect
} from "react";

import {
    Grid, Typography, Card,
    CardContent, Button, CardActions,
    TextField, Divider, FormControl,
    FormControlLabel, Checkbox, InputLabel,
    Select, MenuItem, FormHelperText
} from "@material-ui/core";

import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";

import { useSnackbar } from "notistack";
import MaskedInput, { conformToMask } from "react-text-mask";
import moment from "moment";

import { saveDataUpdate } from "../ajax";
import { getCurrentUser } from "../../sessions/auth";

const logger_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
const conforming_mobile_mask = ["(", "+", /\d/, /\d/, /\d/, ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];


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

function RainSection (props) {
    const { rainGauge, saveUpdate } = props;
    const { date_activated, date_deactivated, rain_id } = rainGauge;
    const [is_edit, setIsEdit] = useState(false);
    const initial_data = {
        value: date_deactivated, helper_text: null
    };
    const [date_deact, setDateDeact] = useState(initial_data);
    
    useEffect(() => {
        setDateDeact(initial_data);
    }, [rainGauge]);
    
    const updateDeact = value => {
        let helper_text = "";
        if (value === null) helper_text = "Required field";
        else if (!value.isValid()) helper_text = "Enter a valid date";
        setDateDeact({
            value, helper_text
        });
    };

    const save = () => {
        setIsEdit(false);
        const updated_data = {
            date_deactivated: date_deact.value.format("YYYY-MM-DD"),
            section: "rain",
            rain_id
        };
        saveUpdate(updated_data);
    };

    const deact = date_deact.value ? moment(date_deact.value).format("DD MMMM YYYY") : "---";

    return <Card variant="outlined">
        <CardContent component={Grid} container spacing={2}>
            <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
                <strong>RAIN GAUGE</strong>
            </Typography>

            { !is_edit && <Fragment>
                <Typography component={Grid}
                    item xs={12} md={6}
                    variant="body1" align="center"
                >
                    <strong>Date activated:</strong> {moment(date_activated).format("DD MMMM YYYY")}
                </Typography>

                <Typography component={Grid}
                    item xs={12} md={6}
                    variant="body1" align="center"
                >
                    <strong>Date deactivated:</strong> {deact}
                </Typography>
            </Fragment> }

            { is_edit && <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid item xs={12} container justify="center">
                    <KeyboardDatePicker
                        required
                        autoOk
                        label="Date Deactivated"
                        value={date_deact.value || null}
                        onChange={e => updateDeact(e)}
                        helperText={date_deact.helper_text || ""}
                        error={Boolean(date_deact.helper_text)}
                        ampm={false}
                        placeholder="2010/01/01"
                        format="YYYY/MM/DD"
                        mask="____/__/__"
                        clearable
                        disableFuture
                    />
                </Grid> 
            </MuiPickersUtilsProvider> }
        </CardContent>
    
        <CardActions style={{ justifyContent: "flex-end" }}>
            {
                !is_edit && (
                    <Button color="primary" onClick={() => setIsEdit(true)}>Edit</Button>
                )
            }
            {
                is_edit && (
                    <Fragment>
                        <Button color="primary" onClick={() => setIsEdit(false)}>Cancel</Button>
                        <Button color="secondary"
                            onClick={() => save()}
                            disabled={Boolean(date_deact.helper_text) || date_deact.helper_text === null}
                        >
                            Save
                        </Button>
                    </Fragment>
                )
            }
        </CardActions>
    </Card>;
}

function TiltSection (props) {
    const { tsmSensor, saveUpdate } = props;
    const {
        date_activated, date_deactivated, version,
        number_of_segments, segment_length, tsm_id
    } = tsmSensor;
    const [is_edit, setIsEdit] = useState(false);
    const initial_data = {
        value: date_deactivated, helper_text: null
    };
    const [date_deact, setDateDeact] = useState(initial_data);

    useEffect(() => {
        setDateDeact(initial_data);
    }, [tsmSensor]);

    const updateDeact = value => {
        let helper_text = "";
        if (value === null) helper_text = "Required field";
        else if (!value.isValid()) helper_text = "Enter a valid date";
        setDateDeact({
            value, helper_text
        });
    };

    const save = () => {
        setIsEdit(false);
        const updated_data = {
            date_deactivated: date_deact.value.format("YYYY-MM-DD"),
            section: "tilt",
            tsm_id
        };
        saveUpdate(updated_data);
    };

    const deact = date_deact.value ? moment(date_deact.value).format("DD MMMM YYYY") : "---";

    return <Card variant="outlined">
        <CardContent component={Grid} container spacing={2}>
            <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
                <strong>TILT SENSOR</strong>
            </Typography>

            { !is_edit && <Fragment>
                <Typography component={Grid}
                    item xs={12} sm={12} md={4}
                    variant="body1" align="center"
                >
                    <strong>Version:</strong> {version}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} md={4}
                    variant="body1" align="center"
                >
                    <strong>No. of segments:</strong> {number_of_segments}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} md={4}
                    variant="body1" align="center"
                >
                    <strong>Segment length:</strong> {segment_length}
                </Typography>

                <Typography component={Grid}
                    item xs={12} md={6}
                    variant="body1" align="center"
                >
                    <strong>Date activated:</strong> {moment(date_activated).format("DD MMMM YYYY")}
                </Typography>

                <Typography component={Grid}
                    item xs={12} md={6}
                    variant="body1" align="center"
                >
                    <strong>Date deactivated:</strong> {deact}
                </Typography>
            </Fragment>}

            { is_edit && <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid item xs={12} container justify="center">
                    <KeyboardDatePicker
                        required
                        autoOk
                        label="Date Deactivated"
                        value={date_deact.value || null}
                        onChange={e => updateDeact(e)}
                        helperText={date_deact.helper_text || ""}
                        error={Boolean(date_deact.helper_text)}
                        ampm={false}
                        placeholder="2010/01/01"
                        format="YYYY/MM/DD"
                        mask="____/__/__"
                        clearable
                        disableFuture
                    />
                </Grid> 
            </MuiPickersUtilsProvider> }
        </CardContent>
    
        <CardActions style={{ justifyContent: "flex-end" }}>
            {
                !is_edit && (
                    <Button color="primary" onClick={() => setIsEdit(true)}>Edit</Button>
                )
            }
            {
                is_edit && (
                    <Fragment>
                        <Button color="primary" onClick={() => setIsEdit(false)}>Cancel</Button>
                        <Button color="secondary"
                            onClick={() => save()}
                            disabled={Boolean(date_deact.helper_text) || date_deact.helper_text === null}
                        >
                            Save
                        </Button>
                    </Fragment>
                )
            }
        </CardActions>
    </Card>;
}

function AccelerometersSection (props) {
    const { tsmSensor, saveUpdate } = props;
    const {
        version, accelerometers
    } = tsmSensor;
    return <Card variant="outlined">
        <CardContent component={Grid} container spacing={2}>
            <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
                <strong>ACCELEROMETERS</strong>
            </Typography>

            {
                accelerometers.map(row => <IndividualAccelerometers
                    row={row} version={version} key={row.accel_id}
                    saveUpdate={saveUpdate}
                />)
            }
        </CardContent>
    </Card>;
}

function IndividualAccelerometers (props) {
    const { row, version, saveUpdate } = props;
    const {
        node_id, accel_number, voltage_min,
        voltage_max, in_use, date_updated,
        status, accel_id, tsm_id
    } = row;
    const default_flag = { status: "", remarks: "" };

    const [is_edit, setIsEdit] = useState(false);
    const [data, setData] = useState({
        in_use: Boolean(in_use),
        voltage_max,
        voltage_min,
        date_updated,
        ...default_flag
    });

    const [add_flag, setAddFlag] = useState(false);
    useEffect(() => {
        setData({ ...data, ...default_flag });
    }, [add_flag]);

    const update_data = (field, value) => {
        setData({ ...data, [field]: value });
    };

    const is_disabled = Object.keys(data).some(x => data[x] === "");

    const update_ts = data.date_updated !== null ? moment(data.date_updated).format("DD MMMM YYYY") : "---";
    const get_status = stat => {
        if (stat === 2) return "Use with caution";
        if (stat === 3) return "Special case";
        if (stat === 4) return "Not OK";
        return "";
    };

    const save = () => {
        setIsEdit(false);
        const ts_updated = moment().format("YYYY-MM-DD");
        const updated_data = {
            ...data,
            section: "accelerometers",
            accel_id,
            node_id,
            tsm_id,
            has_new_status: add_flag,
            flagger: getCurrentUser(),
            ts_updated
        };
        saveUpdate(updated_data);
    };

    return <Fragment key={accel_id}>
        <Grid item xs={12}><Divider /></Grid>

        <Typography variant="subtitle1" 
            display="block" component={Grid} 
            item xs={12}
        >
            <strong><u>Node {node_id}{ version === 1 ? "" : `, Accel ${accel_number}`}</u></strong>
        </Typography>

        {
            !is_edit && <Fragment>
                <Typography component={Grid}
                    item xs={12} sm={4} md={6} lg={2}
                    variant="body1" align="center"
                >
                    <strong>Active:</strong> {data.in_use ? "Yes" : "No"}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={4} md={6} lg={3}
                    variant="body1" align="center"
                >
                    <strong>Min Voltage:</strong> {data.voltage_min}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={4} md={6} lg={3}
                    variant="body1" align="center"
                >
                    <strong>Max Voltage:</strong> {data.voltage_max}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={12} md={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Last Update:</strong> {update_ts}
                </Typography>

                {
                    status.length > 0 && <Fragment>
                        <Typography variant="subtitle1" 
                            display="block" component={Grid} 
                            item xs={12}
                        >
                            <strong>Latest Flag</strong>
                        </Typography>

                        <Typography component={Grid}
                            item xs={12} sm={12} md={6} lg={4}
                            variant="body1" align="center"
                        >
                            <strong>Status:</strong> {get_status(status[0].status)}
                        </Typography>

                        <Typography component={Grid}
                            item xs={12} sm={12} md={6} lg={4}
                            variant="body1" align="center"
                        >
                            <strong>Timestamp:</strong> {moment(status[0].ts_flagged).format("DD MMMM YYYY")}
                        </Typography>

                        <Typography component={Grid}
                            item xs={12} sm={12} md={12} lg={4}
                            variant="body1" align="center"
                        >
                            <strong>Flagger:</strong> {status[0].flagger}
                        </Typography>

                        <Typography component={Grid}
                            item xs={12}
                            variant="body1" align="center"
                        >
                            <strong>Remarks:</strong> {status[0].remarks || "---"}
                        </Typography>
                    </Fragment>
                }
            </Fragment> }

        {
            is_edit && <Fragment>
                <FormControl fullWidth
                    component={Grid}
                    item xs={12} sm={3}
                    style={{ justifyContent: "center", alignItems: "center" }}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={data.in_use}
                                onChange={e => update_data("in_use", e.target.checked)}
                                name="isActive"
                                color="primary"
                            />
                        }
                        label="Active"
                    />
                </FormControl>

                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        required
                        label="Min Voltage"
                        type="number"
                        value={data.voltage_min}
                        onChange={e => update_data("voltage_min", e.target.value)}
                        helperText={data.voltage_min ? "" : "Required field"}
                        error={!data.voltage_min && data.voltage_min !== 0}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        required
                        label="Max Voltage"
                        type="number"
                        value={data.voltage_max}
                        onChange={e => update_data("voltage_max", e.target.value)}
                        helperText={data.voltage_max ? "" : "Required field"}
                        error={!data.voltage_max && data.voltage_max !== 0}
                    />
                </Grid>

                <Grid item xs={12} sm={3} align="center">
                    <Button color="primary" variant="contained" onClick={() => setAddFlag(!add_flag)}>
                        { add_flag ? "Cancel flag" : "Add flag" }
                    </Button>
                </Grid>

                {
                    add_flag && <Fragment>
                        <Grid item xs={12} sm={3}>
                            <FormControl required fullWidth 
                                error={!data.status}
                            >
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={data.status}
                                    onChange={e => update_data("status", e.target.value)}
                                    error={!data.status}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>          
                                    <MenuItem value="2" key="2">Use with caution</MenuItem>
                                    <MenuItem value="3" key="3">Special case</MenuItem>
                                    <MenuItem value="4" key="4">Not OK</MenuItem>
                                </Select>
                                <FormHelperText error>{data.status ? "" : "Required field"}</FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={9}>
                            <TextField
                                fullWidth
                                required
                                label="Remarks"
                                value={data.remarks}
                                onChange={e => update_data("remarks", e.target.value)}
                                helperText={data.remarks ? "" : "Required field"}
                                error={!data.remarks}
                            />
                        </Grid>
                    </Fragment>
                }
            </Fragment>
        }

        <Grid item xs={12} align="right">
            {
                !is_edit && (
                    <Button color="primary" onClick={() => setIsEdit(true)}>Edit</Button>
                )
            }
            {
                is_edit && (
                    <Fragment>
                        <Button color="primary" onClick={() => setIsEdit(false)}>Cancel</Button>
                        <Button color="secondary"
                            onClick={() => save()}
                            disabled={is_disabled}
                        >
                            Save
                        </Button>
                    </Fragment>
                )
            }
        </Grid>
    </Fragment>;
}

function MainSection (props) {
    const { selectedLogger, saveUpdate } = props;
    const {
        date_activated, date_deactivated, latitude,
        longitude, logger_id, logger_mobile: { sim_num, mobile_id },
        logger_model: { logger_type }
    } = selectedLogger;
    
    let conformed_sim = "---";
    if(sim_num){
        const { conformedValue } = conformToMask(sim_num, conforming_mobile_mask);
        conformed_sim = conformedValue;
    }

    const initial_value = {
        date_deactivated: { value: date_deactivated, helper_text: "", required: false },
        logger_number: { value: conformed_sim, helper_text: "", required: true },
        latitude: { value: latitude, helper_text: "", required: true },
        longitude: { value: longitude, helper_text: "", required: true }
    };
    const [is_edit, setIsEdit] = useState(false);
    const [data, setData] = useState(initial_value);

    useEffect(() => {
        setData(initial_value);
    }, [selectedLogger]);

    const update = (field, value) => {
        const field_val = data[field];
        let helper_text = "";
        if (value === "" && Boolean(field_val.required)) helper_text = "Required field";
        if (field === "date_deactivated" && value !== null && !value.isValid()) helper_text = "Enter a valid date";
        if (field === "logger_number" && value.includes("x")) helper_text = "Enter complete mobile number";

        const new_data = { ...data,
            [field]: { ...field_val, value, helper_text }
        };
        setData(new_data);
    };

    const checkFields = () => {
        return Object.keys(data).some(key => {
            const { required, helper_text } = data[key];

            return (
                required && (helper_text !== "" ) ||
                (!required && (helper_text !== ""))
            );
        });
    };
    const [is_disabled, setIsDisabled] = useState(false);
    useEffect(() => setIsDisabled(checkFields()), [data]);

    const save = () => {
        setIsEdit(false);
        const updated_data = {};
        Object.keys(data).forEach(key => {
            const { value } = data[key];
            let val = value;
            if (moment.isMoment(value)) val = value.format("YYYY-MM-DD");
            if (key === "logger_number") val = value.replace(/[()+-\s]/g, "");
            updated_data[key] = val;
        });
        updated_data.section = "loggers";
        updated_data.mobile_id = mobile_id;
        updated_data.logger_id = logger_id;
        saveUpdate(updated_data);
    };

    const deact = data.date_deactivated.value ? moment(data.date_deactivated.value).format("DD MMMM YYYY") : "---";

    return (
        <Card variant="outlined">
            <CardContent component={Grid} container spacing={2}>
                <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
                    <strong>LOGGER INFO</strong>
                </Typography>

                { !is_edit && <Fragment>
                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Date installed:</strong> {moment(date_activated).format("DD MMMM YYYY")}
                    </Typography>

                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Date deactivated:</strong> {deact}
                    </Typography>

                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Type:</strong> {logger_type.toUpperCase()}
                    </Typography>

                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Logger number:</strong> {data.logger_number.value}
                    </Typography>

                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Latitude:</strong> {data.latitude.value}
                    </Typography>

                    <Typography component={Grid}
                        item xs={12} sm={6} lg={4}
                        variant="body1" align="center"
                    >
                        <strong>Longitude:</strong> {data.longitude.value}
                    </Typography>
                </Fragment>}

                { is_edit && <Fragment>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={6} lg={3}>
                            <KeyboardDatePicker
                                autoOk
                                label="Date Deactivated"
                                value={data.date_deactivated.value || null}
                                onChange={e => update("date_deactivated", e)}
                                helperText={data.date_deactivated.helper_text || ""}
                                error={Boolean(data.date_deactivated.helper_text)}
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
                    {
                        data.logger_number.value !== "---" && (
                            <Grid item xs={6} lg={3}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Logger Number"
                                    InputProps={{
                                        inputComponent: TextMaskCustom,
                                        inputProps: { mask: logger_number_mask }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    value={data.logger_number.value}
                                    onChange={e => update("logger_number", e.target.value)}
                                    helperText={data.logger_number.helper_text || ""}
                                    error={Boolean(data.logger_number.helper_text)}
                                />
                            </Grid>
                        )
                    }

                    <Grid item xs={6} lg={3}>
                        <TextField
                            fullWidth
                            required
                            label="Latitude"
                            type="number"
                            value={data.latitude.value}
                            onChange={e => update("latitude", e.target.value)}
                            helperText={data.latitude.helper_text || ""}
                            error={Boolean(data.latitude.helper_text)}
                        />
                    </Grid>

                    <Grid item xs={6} lg={3}>
                        <TextField
                            fullWidth
                            required
                            label="Longitude"
                            type="number"
                            value={data.longitude.value}
                            onChange={e => update("longitude", e.target.value)}
                            helperText={data.longitude.helper_text || ""}
                            error={Boolean(data.longitude.helper_text)}
                        />
                    </Grid>
                </Fragment> }
            </CardContent>
        
            <CardActions style={{ justifyContent: "flex-end" }}>
                {
                    !is_edit && (
                        <Button color="primary" onClick={() => setIsEdit(true)}>Edit</Button>
                    )
                }
                {
                    is_edit && (
                        <Fragment>
                            <Button color="primary" onClick={() => setIsEdit(false)}>Cancel</Button>
                            <Button color="secondary"
                                onClick={() => save()}
                                disabled={is_disabled}
                            >
                                Save
                            </Button>
                        </Fragment>
                    )
                }
            </CardActions>
        </Card>
    );
}

function LoggerDetails (props) {
    const { selectedLogger, setReloadList } = props;
    const {
        logger_name, logger_model: {
            has_rain, has_tilt
        }, tsm_sensor, rain_gauge
    } = selectedLogger;

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const save_update = updated_data => {
        // eslint-disable-next-line no-param-reassign
        updated_data.has_rain = has_rain;
        if (has_rain === 1) {
            // eslint-disable-next-line no-param-reassign
            updated_data.rain = rain_gauge;
        }
        setReloadList(true);
        console.log(updated_data);
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
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

    return (
        <Grid container spacing={2} justify="space-evenly">
            <Typography
                component={Grid}
                item xs={12}
                variant="h6"
            >
                <strong>{logger_name.toUpperCase()}</strong>
            </Typography>

            <Grid item xs={12}>
                <MainSection
                    selectedLogger={selectedLogger}
                    saveUpdate={save_update} />
            </Grid>

            {
                has_rain === 1 && Boolean(rain_gauge) && 
                    <Grid item xs={12}><RainSection rainGauge={rain_gauge} saveUpdate={save_update} /></Grid>
            }

            {
                has_tilt === 1 && Boolean(tsm_sensor) &&
                    <Fragment>
                        <Grid item xs={12}><TiltSection tsmSensor={tsm_sensor} saveUpdate={save_update} /></Grid>
                        <Grid item xs={12}><AccelerometersSection tsmSensor={tsm_sensor} saveUpdate={save_update} /></Grid>
                    </Fragment>
            }
        </Grid>
    );
}

export default LoggerDetails;