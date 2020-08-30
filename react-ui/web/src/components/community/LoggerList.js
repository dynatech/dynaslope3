import React, { useState, useEffect, useReducer, Fragment } from "react";
import {
    ExpansionPanel, ExpansionPanelDetails,
    ExpansionPanelSummary, makeStyles, Button,
    Grid, Typography, Divider, CardActions,
    CardContent, FormControl, TextField, Card,
    Checkbox, FormControlLabel
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { useSnackbar } from "notistack";
import { capitalizeFirstLetter } from "../../UtilityFunctions";
import { saveDataUpdate } from "./ajax";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%"
    },
    icons: {
        fontSize: "1.15rem",
        [theme.breakpoints.down("xs")]: {
            fontSize: "1.7rem"
        }
    },
    details: {
        alignItems: "center",
    },
    column: {
        flexBasis: "33.33%",
    },
    helper: {
        borderLeft: `2px solid ${theme.palette.divider}`,
        padding: `${theme.spacing()}px ${theme.spacing(2)}px`,
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline",
        },
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
}));

function getHelperText (field, value) {
    if (value === "") return "Required field";
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

function UpdateLoggerContainer (props) {
    const { 
        loggerData, dispatch, updateDateDeactivated,
        currentDatetime, updateData, classes 
    } = props;

    const [old_data, setOldData] = useState(loggerData);
    const [updated_data, setUpdatedData] = useState([]);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        const sanitize_data = sanitizeData(loggerData);
        sanitize_data.data_to_update = "loggers";
        setUpdatedData(sanitize_data);
    }, [loggerData]);

    const saveUpdate = () => {
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
                variant = "success";
                updateData();
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

    const cancelUpdate = () => {
        dispatch({ type: "RESET", value: sanitizeData(old_data) });
        updateData();
    };
    
    return (
        <Grid item xs={12} sm={12} lg={12} key={`update_logger_details_${loggerData.logger_id.value + 1}`}>
            <Card className={classes.root} key={`update_logger_details_card_${loggerData.logger_id.value + 1}`}>
                <CardContent key={`update_logger_details_content_${loggerData.logger_id.value + 1}`}>
                    <Typography variant="body1">Update logger details</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={12}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Date deactivated"
                                        value={loggerData.date_deactivated.value || currentDatetime}
                                        onChange={updateDateDeactivated}
                                        ampm={false}
                                        placeholder="2010/01/01"
                                        format="YYYY/MM/DD"
                                        mask="__/__/____"
                                        clearable
                                        disableFuture
                                    />
                                </MuiPickersUtilsProvider>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}> 
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <TextField
                                    label="Latitude"
                                    value={loggerData.latitude.value || ""}
                                    helperText={loggerData.latitude.helper_text || ""}
                                    error={Boolean(loggerData.latitude.helper_text)}
                                    onChange={e => dispatch({ type: "UPDATE", field: "latitude", value: e.target.value })}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <TextField
                                    label="Longitude"
                                    value={loggerData.longitude.value || ""}
                                    helperText={loggerData.longitude.helper_text || ""}
                                    error={Boolean(loggerData.longitude.helper_text)}
                                    onChange={e => dispatch({ type: "UPDATE", field: "longitude", value: e.target.value })}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => saveUpdate()}
                        >
                            Save
                        </Button>
                        <Button 
                            size="small" color="primary"
                            onClick={() => cancelUpdate()}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function LoggerDetailsContainer (props) {
    const { 
        loggerData,
        loggerModel: {
            logger_type, has_rain, has_tilt,
            has_piezo, has_soms
        },
        classes
    } = props;

    const [isForUpdate, setIsForUpdate] = useState(false);
    const [logger_data, dispatch] = useReducer(reducerFunction, loggerData, initReducer);
    const update_date_deactivated = value => dispatch({ type: "UPDATE", field: "date_deactivated", value: moment(value).format("YYYY-MM-DD") });
    const current_date_time = moment().format("YYYY-MM-DD");
    
    const updateData = () => {
        setIsForUpdate(!isForUpdate);
    };

    if (isForUpdate) {
        return (
            <UpdateLoggerContainer
                loggerData={logger_data}
                dispatch={dispatch}
                updateDateDeactivated={update_date_deactivated}
                currentDatetime={current_date_time}
                updateData={updateData}
                classes={classes}
            />
        );
    }

    return (
        <Grid item xs={12} sm={12} lg={12} key={`logger_details_${logger_data.logger_id.value + 1}`}>
            <Card className={classes.root} key={`logger_details_card_${logger_data.logger_id.value + 1}`}>
                <CardContent key={`logger_details_content_${logger_data.logger_id.value + 1}`}>
                    <Typography variant="body1">Logger Details & Models</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={6}>
                            <Typography variant="subtitle2">
                                Latitude: {logger_data.latitude.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Longitude: {logger_data.longitude.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date activated: {logger_data.date_activated.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date deactivated: {logger_data.date_deactivated.value || "None"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <Typography variant="subtitle2">
                                Logger type: {capitalizeFirstLetter(logger_type)}
                            </Typography>
                            <Typography variant="subtitle2">
                                Has tilt: {has_tilt ? "Yes" : "No"}
                            </Typography>
                            <Typography variant="subtitle2">
                                Has rain: {has_rain ? "Yes" : "No"}
                            </Typography>
                            <Typography variant="subtitle2">
                                Has piezo: {has_piezo ? "Yes" : "No"}
                            </Typography>
                            <Typography variant="subtitle2">
                                Has soms: {has_soms ? "Yes" : "No"}
                            </Typography>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => updateData()}
                        >
                            Update
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function UpdateLoggerMobileContainer (props) {
    const {
        loggerMobileData, dispatch,
        updateData, classes
    } = props;

    const [old_data, setOldData] = useState(loggerMobileData);
    const [updated_data, setUpdatedData] = useState([]);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        const sanitize_data = sanitizeData(loggerMobileData);
        sanitize_data.data_to_update = "mobile";
        setUpdatedData(sanitize_data);
    }, [loggerMobileData]);

    const saveUpdate = () => {
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
                variant = "success";
                updateData();
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

    const cancelUpdate = () => {
        dispatch({ type: "RESET", value: sanitizeData(old_data) });
        updateData();
    };

    return (
        <Grid item xs={12} sm={12} lg={12} key={`update_logger_details_${loggerMobileData.mobile_id.value + 1}`}>
            <Card className={classes.root} key={`update_logger_details_card_${loggerMobileData.mobile_id.value + 1}`}>
                <CardContent key={`update_logger_details_content_${loggerMobileData.mobile_id.value + 1}`}>
                    <Typography variant="body1">Update logger mobile</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={12}>
                            <FormControl fullWidth>
                                <TextField
                                    label="Logger Mobile Number"
                                    value={loggerMobileData.sim_num.value}
                                    type="number"
                                    onChange={e => dispatch({ type: "UPDATE", field: "sim_num", value: e.target.value })}
                                    helperText={loggerMobileData.sim_num.helper_text || ""}
                                    error={Boolean(loggerMobileData.sim_num.helper_text)}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => saveUpdate()}
                        >
                            Save
                        </Button>
                        <Button 
                            size="small" color="primary"
                            onClick={() => cancelUpdate()}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function LoggerMobileContainer (props) {
    const {
        loggerMobile, classes
    } = props;

    const [isForUpdate, setIsForUpdate] = useState(false);
    const [logger_mobile_data, dispatch] = useReducer(reducerFunction, loggerMobile, initReducer);

    const updateData = () => {
        setIsForUpdate(!isForUpdate);
    };

    if (isForUpdate) {
        return (
            <UpdateLoggerMobileContainer
                loggerMobileData={logger_mobile_data}
                dispatch={dispatch}
                updateData={updateData}
                classes={classes}
            />
        );
    }

    const mobile_number = logger_mobile_data.sim_num;
    if (mobile_number === undefined) {
        dispatch({ type: "UPDATE", field: "sim_num", value: "" });
        return ("");
    }

    return (
        <Grid item xs={12} sm={12} lg={12} key={`logger_mobile_${logger_mobile_data.mobile_id.value + 1}`}>
            <Card className={classes.root} key={`logger_mobile_card_${logger_mobile_data.mobile_id.value + 1}`}>
                <CardContent key={`logger_mobile_content_${logger_mobile_data.mobile_id.value + 1}`}>
                    <Typography variant="body1">Logger Mobile</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={6}>
                            <Typography variant="subtitle2">
                                Mobile number: {logger_mobile_data.sim_num.value || "None, please update."}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <Typography variant="subtitle2">
                                Date activated: {logger_mobile_data.date_activated.value}
                            </Typography>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => updateData()}
                        >
                            Update
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function UpdateTSMContainer (props) {
    const {
        tsmSensor, dispatch, updateDateDeactivated,
        currentDatetime, updateData, classes
    } = props;
    const [old_data, setOldData] = useState(tsmSensor);
    const [updated_data, setUpdatedData] = useState([]);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        const sanitize_data = sanitizeData(tsmSensor);
        sanitize_data.data_to_update = "tsm";
        setUpdatedData(sanitize_data);
    }, [tsmSensor]);

    const saveUpdate = () => {
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
                variant = "success";
                updateData();
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

    const cancelUpdate = () => {
        dispatch({ type: "RESET", value: sanitizeData(old_data) });
        updateData();
    };

    return (
        <Grid item xs={12} sm={12} lg={12} key={`update_tsm_details_${tsmSensor.tsm_id.value + 1}`}>
            <Card className={classes.root} key={`update_tsm_details_card_${tsmSensor.tsm_id.value + 1}`}>
                <CardContent key={`update_tsm_details_content_${tsmSensor.tsm_id.value + 1}`}>
                    <Typography variant="body1">Update TSM details</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={12}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Date deactivated"
                                        value={tsmSensor.date_deactivated.value || currentDatetime}
                                        onChange={updateDateDeactivated}
                                        ampm={false}
                                        placeholder="2010/01/01"
                                        format="YYYY/MM/DD"
                                        mask="__/__/____"
                                        clearable
                                        disableFuture
                                    />
                                </MuiPickersUtilsProvider>
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => saveUpdate()}
                        >
                            Save
                        </Button>
                        <Button 
                            size="small" color="primary"
                            onClick={() => cancelUpdate()}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}


function TSMDetailsContainer (props) {
    const {
        tsmSensor,
        classes
    } = props;
    const [isForUpdate, setIsForUpdate] = useState(false);
    const [isAccelerometers, setIsAccelerometers] = useState(false);
    const [tsm_data, dispatch] = useReducer(reducerFunction, tsmSensor, initReducer);
    const update_date_deactivated = value => dispatch({ type: "UPDATE", field: "date_deactivated", value: moment(value).format("YYYY-MM-DD") });
    const current_date_time = moment().format("YYYY-MM-DD");

    const updateData = () => {
        setIsForUpdate(!isForUpdate);
    };

    const showAccelerometers = () => {
        setIsAccelerometers(!isAccelerometers);
    };

    if (isForUpdate) {
        return (
            <UpdateTSMContainer
                tsmSensor={tsm_data}
                dispatch={dispatch}
                updateDateDeactivated={update_date_deactivated}
                currentDatetime={current_date_time}
                updateData={updateData}
                classes={classes}
            />
        );
    }

    if (isAccelerometers) {
        return (
            <Accelerometers
                accelerometers={tsmSensor.accelerometers}
                classes={classes}
                showAccelerometers={showAccelerometers}
            />
        );
    }

    return (
        <Grid item xs={12} sm={12} lg={12} key={`tsm_${tsm_data.tsm_id.value + 1}`}>
            <Card className={classes.root} key={`tsm_card_${tsm_data.tsm_id.value + 1}`}>
                <CardContent key={`tsm_content_${tsm_data.tsm_id.value + 1}`}>
                    <Typography variant="body1">TSM Details</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={6} lg={6}>
                            <Typography variant="subtitle2">
                                TSM Name: {tsm_data.tsm_name.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date activated: {tsm_data.date_activated.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date deactivated: {tsm_data.date_deactivated.value || "None"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} lg={6}>
                            <Typography variant="subtitle2">
                                Number of segment: {tsm_data.number_of_segments.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Segment length: {tsm_data.segment_length.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Version: {tsm_data.version.value}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => updateData()}
                        >
                            Update
                        </Button>
                        <Button 
                            size="small" color="secondary"
                            onClick={() => showAccelerometers()}
                        >
                            Accelerometers
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function UpdateAccelContainer (props) {
    const { 
        accelData, dispatch, updateTsUpdate,
        currentDatetime, updateData, classes 
    } = props;
    const [old_data, setOldData] = useState(accelData);
    const [updated_data, setUpdatedData] = useState([]);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        const sanitize_data = sanitizeData(accelData);
        sanitize_data.data_to_update = "accel";
        setUpdatedData(sanitize_data);
    }, [accelData]);

    const saveUpdate = () => {
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
                variant = "success";
                updateData();
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

    const cancelUpdate = () => {
        dispatch({ type: "RESET", value: sanitizeData(old_data) });
        updateData();
    };

    const handleChange = (event) => {
        const {
            target: { checked }
        } = event;
        dispatch({ type: "UPDATE", field: "in_use", value: checked ? 1 : 0 });
    };

    return (
        <Grid item xs={12} sm={12} lg={12} key={`update_accel_${accelData.accel_id.value + 1}`}>
            <Card className={classes.root} key={`update_accel_card_${accelData.accel_id.value + 1}`}>
                <CardContent key={`update_accel_content_${accelData.accel_id.value + 1}`}>
                    <Typography variant="body1">Update logger details</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={6}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Timestamp updated"
                                        value={accelData.ts_updated.value || currentDatetime}
                                        onChange={updateTsUpdate}
                                        ampm={false}
                                        placeholder="2010/01/01"
                                        format="YYYY/MM/DD"
                                        mask="__/__/____"
                                        clearable
                                        disableFuture
                                    />
                                </MuiPickersUtilsProvider>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!accelData.in_use.value}
                                            onChange={handleChange}
                                            name="checkedB"
                                            color="primary"
                                        />
                                    }
                                    label="Is in use?"
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}> 
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <TextField
                                    label="Maximum Voltage"
                                    value={accelData.voltage_max.value || ""}
                                    helperText={accelData.voltage_max.helper_text || ""}
                                    error={Boolean(accelData.voltage_max.helper_text)}
                                    onChange={e => dispatch({ type: "UPDATE", field: "voltage_max", value: e.target.value })}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <TextField
                                    label="Minimum Voltage"
                                    value={accelData.voltage_min.value || ""}
                                    helperText={accelData.voltage_min.helper_text || ""}
                                    error={Boolean(accelData.voltage_min.helper_text)}
                                    onChange={e => dispatch({ type: "UPDATE", field: "voltage_min", value: e.target.value })}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => saveUpdate()}
                        >
                            Save
                        </Button>
                        <Button 
                            size="small" color="primary"
                            onClick={() => cancelUpdate()}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );

}

function NodeAccelContainer (props) {
    const { accel, classes, index } = props;

    const [accel_data, dispatch] = useReducer(reducerFunction, accel, initReducer);
    const [isForUpdate, setIsForUpdate] = useState(false);
    const update_ts_updated = value => dispatch({ type: "UPDATE", field: "ts_updated", value: moment(value).format("YYYY-MM-DD") });
    const current_date_time = moment().format("YYYY-MM-DD");
    const updateData = () => {
        setIsForUpdate(!isForUpdate);
    };

    if (isForUpdate) {
        return (
            <UpdateAccelContainer
                accelData={accel_data}
                dispatch={dispatch}
                updateTsUpdate={update_ts_updated}
                currentDatetime={current_date_time}
                updateData={updateData}
                classes={classes}
            />
        );
    }

    return (
        <Grid item xs={12} sm={12} lg={12} index={`node_data_${index + 1}`}>
            <Card className={classes.root} index={`node_data_card_${index + 1}`}>
                <CardContent index={`node_data_content_${index + 1}`}>
                    <Typography variant="body1">Accel {accel_data.accel_number.value}</Typography>
                    <Typography variant="body1">Max voltage: {accel_data.voltage_max.value}</Typography>
                    <Typography variant="body1">Min voltage: {accel_data.voltage_min.value}</Typography>
                    <Typography variant="body1">Timestamp Updated: {accel_data.ts_updated.value || "None"}</Typography>
                    <Typography variant="body1">In use: {accel_data.in_use.value ? "Yes" : "No"}</Typography>
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => updateData()}
                        >
                            Update
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function Accelerometers (props) {
    const { accelerometers, classes, showAccelerometers } = props;
    
    const accelerometers_by_node = [];
    accelerometers.forEach((row, index) => {
        const { node_id } = row;
        // eslint-disable-next-line no-prototype-builtins
        const check_key = accelerometers_by_node.hasOwnProperty(node_id);
        if (check_key) {
            accelerometers_by_node[node_id] = [...accelerometers_by_node[node_id], row];
        } else {
            accelerometers_by_node[node_id] = [row];
        }
    });
    const [accelerometer_data, dispatch] = useReducer(reducerFunction, accelerometers_by_node);
    return (        
        <Fragment key="accelerometers_container">
            <Grid item xs={12} sm={12} lg={12} key="accelerometers">
                <Card className={classes.root} key="accelerometers_card">
                    <CardContent key="accelerometer_content">
                        <Typography variant="body1">Accelerometers by Node</Typography>
                        <Grid container spacing={3} style={{ marginTop: 6 }}>
                            {
                                accelerometer_data.map((item, i) => (
                                    <Grid item xs={12} sm={12} lg={12} key={`accelerometer_node_${i + 1}`}>
                                        <ExpansionPanel key={`accelerometer_node_panel_${i + 1}`}>
                                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="body1">Node {i}</Typography>
                                            </ExpansionPanelSummary>
                                            <Divider />
                                            <Grid container spacing={3} style={{ padding: 10 }}>
                                                {
                                                    item.map((accel, i) => (
                                                        <NodeAccelContainer
                                                            accel={accel}
                                                            index={i}
                                                            classes={classes}
                                                        />
                                                    ))
                                                }
                                            </Grid>
                                            <Divider />
                                        </ExpansionPanel>
                                    </Grid>
                                ))
                            }
                        </Grid>
                    </CardContent>
                    <CardActions disableSpacing>
                        <Grid container justify="flex-end">
                            <Button 
                                size="small" color="primary"
                                onClick={() => showAccelerometers()}
                            >
                                Back
                            </Button>
                        </Grid>
                    </CardActions>
                </Card>
            </Grid>
        </Fragment>
    );


}

function UpdateRainGagueContainer (props) {
    const { 
        rainGaugeData, dispatch,
        updateData, classes,
        currentDatetime, updateDateDeactivated
    } = props;

    const [old_data, setOldData] = useState(rainGaugeData);
    const [updated_data, setUpdatedData] = useState([]);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        const sanitize_data = sanitizeData(rainGaugeData);
        sanitize_data.data_to_update = "rain_gauge";
        setUpdatedData(sanitize_data);
    }, [rainGaugeData]);

    const saveUpdate = () => {
        saveDataUpdate(updated_data, data => {
            const { status, message } = data;
            let variant;
            if (status === true) {
                variant = "success";
                updateData();
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

    const cancelUpdate = () => {
        dispatch({ type: "RESET", value: sanitizeData(old_data) });
        updateData();
    };

    return (
        <Grid item xs={12} sm={12} lg={12} key={`update_logger_details_${rainGaugeData.rain_id.value + 1}`}>
            <Card className={classes.root} key={`update_logger_details_card_${rainGaugeData.rain_id.value + 1}`}>
                <CardContent key={`update_logger_details_content_${rainGaugeData.rain_id.value + 1}`}>
                    <Typography variant="body1">Update rain gauge</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={12}>
                            <FormControl fullWidth style={{ marginTop: 6 }}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Date deactivated"
                                        value={rainGaugeData.date_deactivated.value || currentDatetime}
                                        onChange={updateDateDeactivated}
                                        ampm={false}
                                        placeholder="2010/01/01"
                                        format="YYYY/MM/DD"
                                        mask="__/__/____"
                                        clearable
                                        disableFuture
                                    />
                                </MuiPickersUtilsProvider>
                            </FormControl>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => saveUpdate()}
                        >
                            Save
                        </Button>
                        <Button 
                            size="small" color="primary"
                            onClick={() => cancelUpdate()}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function RainGaugeDetailsContainer (props) {
    const {
        rainGauge, classes
    } = props;
    const [isForUpdate, setIsForUpdate] = useState(false);
    const [rain_gauge_data, dispatch] = useReducer(reducerFunction, rainGauge, initReducer);
    const update_date_deactivated = value => dispatch({ type: "UPDATE", field: "date_deactivated", value: moment(value).format("YYYY-MM-DD") });
    const current_date_time = moment().format("YYYY-MM-DD");

    const updateData = () => {
        setIsForUpdate(!isForUpdate);
    };

    if (isForUpdate) {
        return (
            <UpdateRainGagueContainer
                rainGaugeData={rain_gauge_data}
                dispatch={dispatch}
                updateDateDeactivated={update_date_deactivated}
                currentDatetime={current_date_time}
                updateData={updateData}
                classes={classes}
            />
        );
    }

    return (
        <Grid item xs={12} sm={12} lg={12} key={`rain_gauge_${rain_gauge_data.rain_id.value + 1}`}>
            <Card className={classes.root} key={`rain_gauge_card_${rain_gauge_data.rain_id.value + 1}`}>
                <CardContent key={`rain_gauge_content_${rain_gauge_data.rain_id.value + 1}`}>
                    <Typography variant="body1">Rain Gauge</Typography>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <Grid item xs={12} sm={12} lg={6}>
                            <Typography variant="subtitle2">
                                Gauge name: {rain_gauge_data.gauge_name.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Latitude: {rain_gauge_data.latitude.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Longitude: {rain_gauge_data.longitude.value}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date activated: {moment(rain_gauge_data.date_activated.value).format("YYYY-MM-DD")}
                            </Typography>
                            <Typography variant="subtitle2">
                                Date deactivated: {rain_gauge_data.date_deactivated.value || "None"}
                            </Typography>
                        </Grid>
                    </Grid>
                    
                </CardContent>
                <CardActions disableSpacing>
                    <Grid container justify="flex-end">
                        <Button 
                            size="small" color="primary"
                            onClick={() => updateData()}
                        >
                            Update
                        </Button>
                    </Grid>
                </CardActions>
            </Card>
        </Grid>
    );
}

function LoggerDataContainer (props) {
    const { loggerData, rainGauge, classes } = props;
    const { 
        logger_mobile, logger_model, tsm_sensor,
        logger_id
    } = loggerData;
    const { 
        has_rain, has_tilt,
        has_piezo, has_soms
    } = logger_model;
    
    return (
        <Fragment key={`looger_data_container_${logger_id}`}>
            <LoggerDetailsContainer
                loggerData={loggerData}
                loggerModel={logger_model}
                classes={classes}
            />
            <LoggerMobileContainer
                loggerMobile={logger_mobile}
                classes={classes}
            />
            {
                tsm_sensor && (
                    <TSMDetailsContainer
                        tsmSensor={tsm_sensor}
                        classes={classes}
                    />
                )
            }
            {
                rainGauge && (
                    <RainGaugeDetailsContainer
                        rainGauge={rainGauge}
                        classes={classes}
                    />
                )
            }
        </Fragment>
    );
}

function LoggerMainContaiter (props) {
    const { loggerData, rain_gauge } = props;
    const { logger_name, logger_id } = loggerData;
    const classes = useStyles();
    return (
        <Fragment key={`logger_main_container_${logger_id}`}>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">Logger name: {logger_name}</Typography>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails className={classes.details}>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <LoggerDataContainer
                            loggerData={loggerData}
                            rainGauge={rain_gauge}
                            classes={classes}
                        />
                    </Grid>
                </ExpansionPanelDetails>
                <Divider />
            </ExpansionPanel>
        </Fragment>
    );
}

export default React.memo(LoggerMainContaiter);