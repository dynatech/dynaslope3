import React, { 
    useState, useEffect,
    Fragment, useReducer
} from "react";

import {
    Button, makeStyles,
    Card, CardContent,
    Typography, Grid
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import MomentUtils from "@date-io/moment";
import moment from "moment";
import Highcharts from "highcharts";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import { getCommsAnalyticsData } from "../ajax";

import EwiChart from "./EwiChart";
import EwiAckChart from "./EwiAckChart";
import GroundMeasChart from "./GroundMeasChart";

window.Highcharts = Highcharts;
NoDataToDisplay(window.Highcharts);

const useStyles = makeStyles(theme => {
    const gen = GeneralStyles(theme);
    return {
        ...gen,
        inputGridContainer: {
            margin: "12px 0",
            [theme.breakpoints.down("sm")]: {
                margin: "0 0"
            }
        },
        buttonGrid: {
            textAlign: "right",
            [theme.breakpoints.down("sm")]: {
                textAlign: "right"
            }
        },
        button: {
            fontSize: 16,
            paddingLeft: 8
        },
        alert3: {
            ...gen.alert3,
            "&:hover *": {
                color: "#222222 !important"
            },
        },
        card: { height: "auto" }
    }; 
});

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
    if (data) {

        Object.keys(data).forEach(key => {
            const updated_value = data[key] ? data[key] : "";
            const field = new_data[key];
            const new_helper_text = getHelperText(field, updated_value);
            new_data[key] = {
                value: updated_value,
                helper_text: new_helper_text,
                required: true
            };
        });
    }

    return new_data;
}

function sanitizeData (data) {
    const clean_data = {};
    Object.keys(data).forEach(key => {
        clean_data[key] = data[key].value;
    });

    return clean_data;
}

function CommunicationsAnalytics (props) {
    const classes = useStyles();

    const current_date_time = moment().format("YYYY-MM-DD HH:mm:ss");
    const month_per_quarter = {
        "1": ["01", "02", "03"],
        "2": ["04", "05", "06"],
        "3": ["07", "08", "09"],
        "4": ["10", "11", "12"]
    };

    const current_quarter = moment(current_date_time).quarter();
    const start_ts = moment().format(`YYYY-${month_per_quarter[current_quarter][0]}-DD HH:mm:ss`);
    const sms_initial_filter_data = {
        start_ts,
        end_ts: current_date_time,
        is_loading: true
    };

    const initial_filter_data = {
        start_ts: moment().subtract(12, "months")
        .format("YYYY-MM-DD HH:mm:ss"),
        end_ts: current_date_time,
        site: ""
    };
    const initial_data = {
        data: [],
        is_loading: true
    };
    const [sms_filter_data, dispatchSmsFilter] = useReducer(reducerFunction, sms_initial_filter_data, initReducer);
    const [ack_filter_data, dispatchAckFilter] = useReducer(reducerFunction, initial_filter_data, initReducer);
    const [ground_meas_filter_data, dispatchGroundMeasFilter] = useReducer(reducerFunction, initial_filter_data, initReducer);
    const [per_month_ewi_sms, setPerMonthEwiSms] = useState(initial_data);
    const [per_quarter_ewi_sms, setPerQuarterEwiSms] = useState(initial_data);
    const [per_day_ack, setPerDayAck] = useState(initial_data);
    const [per_hour_ack, setPerHourAck] = useState(initial_data);
    const [ground_meas_data, setGroundMeasData] = useState(initial_data);

    const update_ts = (field, value, type) => {
        if (type === "sms") {
            dispatchSmsFilter({ 
                type: "UPDATE", field,
                value: moment(value).format("YYYY-MM-DD HH:mm:ss")
            });
        } else if (type === "ack") {
            dispatchAckFilter({ 
                type: "UPDATE", field,
                value: moment(value).format("YYYY-MM-DD HH:mm:ss")
            });
        } else if (type === "ground_meas") {
            dispatchGroundMeasFilter({ 
                type: "UPDATE", field,
                value: moment(value).format("YYYY-MM-DD HH:mm:ss")
            });
        }
    };

    const setChartData = (type, chart_data, is_loading = false) => {
        if (type === "sms") {
            const { data: { per_month, per_quarter } } = chart_data;
            setPerMonthEwiSms({ data: per_month, is_loading });
            setPerQuarterEwiSms({ data: per_quarter, is_loading });
        } else if (type === "ack") {
            const { data: { per_day, per_hour } } = chart_data;
            setPerDayAck({ data: per_day, is_loading });
            setPerHourAck({ data: per_hour, is_loading });
        } else if (type === "ground_meas") {
            const { data } = chart_data;
            setGroundMeasData({ data, is_loading });
        }
    };
    
    const submitFilter = type => () => {
        let input_data;
        if (type === "sms") {
            input_data = sanitizeData(sms_filter_data);
        } else if (type === "ack") {
            input_data = sanitizeData(ack_filter_data);
        } else if (type === "ground_meas") {
            input_data = sanitizeData(ground_meas_filter_data);
            initial_data.data = null;
        }
        setChartData(type, initial_data, true);
        input_data.chart_type = type;
        getCommsAnalyticsData(input_data, data => {
            setChartData(type, data);
        });
    };

    const updateSite = value => {
        dispatchAckFilter({
            type: "UPDATE", field: "site", value
        });
    };

    useEffect(() => {
        const input_arr = [
            {
                chart_type: "ack",
                inputs: sanitizeData(ack_filter_data)
            },
            {
                chart_type: "ground_meas",
                inputs: sanitizeData(ground_meas_filter_data)
            },
            {
                chart_type: "sms",
                inputs: sanitizeData(sms_filter_data)
            }
        ];

        input_arr.forEach(row => {
            row.inputs.chart_type = row.chart_type;
            getCommsAnalyticsData(row.inputs, data => {
                setChartData(row.chart_type, data);
            });
        });
    }, []);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Monitoring Alerts Analytics"
                />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Percentage DSL EWI sent
                                </Typography>

                                <Grid container spacing={2} justify="space-between">
                                    <Grid item xs={12} sm={12} container>
                                        <MuiPickersUtilsProvider utils={MomentUtils}>
                                            <Grid item xs={12} sm={3}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="Start Timestamp"
                                                    ampm={false}
                                                    value={sms_filter_data.start_ts.value}
                                                    onChange={e => update_ts("start_ts", e, "sms")}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={3} style={{ marginLeft: 16 }}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="End Timestamp"
                                                    ampm={false}
                                                    value={sms_filter_data.end_ts.value}
                                                    onChange={e => update_ts("end_ts", e, "sms")}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>
                                        </MuiPickersUtilsProvider>
                                        <Grid item xs={3} style={{ marginLeft: 16, marginTop: 16 }}>
                                            <Button 
                                                size="small" 
                                                color="primary"
                                                variant="contained"
                                                onClick={submitFilter("sms")}
                                            >
                                                Submit
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} sm={12} container>
                                        <Grid item xs={12} sm={12}>
                                            <EwiChart
                                                highcharts={Highcharts}
                                                data={per_month_ewi_sms.data}
                                                isLoading={per_month_ewi_sms.is_loading}
                                                type="Monthly"
                                                input={sanitizeData(sms_filter_data)}
                                            />
                                        </Grid> 
                                        <Grid item xs={12} sm={12}>   
                                            <EwiChart
                                                highcharts={Highcharts}
                                                data={per_quarter_ewi_sms.data}
                                                isLoading={per_quarter_ewi_sms.is_loading}
                                                type="Quarterly"
                                                input={sanitizeData(sms_filter_data)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    EWI Acknowledgement
                                </Typography>


                                <Grid container spacing={2} justify="space-between">
                                    <Grid item xs={12} sm={12} container>
                                        <MuiPickersUtilsProvider utils={MomentUtils}>
                                            <Grid item xs={12} sm={3} style={{ marginTop: 5 }}>
                                                <DynaslopeSiteSelectInputForm
                                                    value={ack_filter_data.site.value}
                                                    changeHandler={e => updateSite(e)}
                                                    isClearable
                                                    customPlaceholder="If no input, all sites"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="Start Timestamp"
                                                    value={ack_filter_data.start_ts.value}
                                                    ampm={false}
                                                    placeholder="2010/01/01 00:00"
                                                    onChange={e => update_ts("start_ts", e, "ack")}
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={3} style={{ marginLeft: 16 }}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="End Timestamp"
                                                    value={ack_filter_data.end_ts.value}
                                                    ampm={false}
                                                    placeholder="2010/01/01 00:00"
                                                    onChange={e => update_ts("end_ts", e, "ack")}
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>
                                        </MuiPickersUtilsProvider>
                                        <Grid item xs={3} sm={2} style={{ marginLeft: 16, marginTop: 16 }}>
                                            <Button 
                                                size="small" 
                                                color="primary"
                                                variant="contained"
                                                onClick={submitFilter("ack")}
                                            >
                                                Submit
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} sm={12} container>
                                        <Grid item xs={12} sm={12}>
                                            <EwiAckChart
                                                highcharts={Highcharts}
                                                data={per_day_ack.data}
                                                isLoading={per_day_ack.is_loading}
                                                type="day"
                                                input={sanitizeData(ack_filter_data)}
                                            />

                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <EwiAckChart
                                                highcharts={Highcharts}
                                                data={per_hour_ack.data}
                                                isLoading={per_hour_ack.is_loading}
                                                type="hour"
                                                input={sanitizeData(ack_filter_data)}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Percentage of ground measurement per site
                                </Typography>

                                <Grid container spacing={2} justify="space-between">
                                    <Grid item xs={12} sm={12} container>
                                        <MuiPickersUtilsProvider utils={MomentUtils}>
                                            <Grid item xs={12} sm={3}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="Start Timestamp"
                                                    ampm={false}
                                                    value={ground_meas_filter_data.start_ts.value}
                                                    onChange={e => update_ts("start_ts", e, "ground_meas")}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={3} style={{ marginLeft: 16 }}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="End Timestamp"
                                                    ampm={false}
                                                    value={ground_meas_filter_data.end_ts.value}
                                                    onChange={e => update_ts("end_ts", e, "ground_meas")}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>
                                        </MuiPickersUtilsProvider>
                                        <Grid item xs={3} style={{ marginLeft: 16, marginTop: 16 }}>
                                            <Button 
                                                size="small" 
                                                color="primary"
                                                variant="contained"
                                                onClick={submitFilter("ground_meas")}
                                            >
                                                Submit
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} sm={12} container>
                                        <Grid item xs={12} sm={12}>
                                            <GroundMeasChart
                                                highcharts={Highcharts}
                                                data={ground_meas_data.data}
                                                isLoading={ground_meas_data.is_loading}
                                                input={sanitizeData(ground_meas_filter_data)}
                                            />
                                        </Grid> 
                                    </Grid>
                                    

                                    
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>
        </Fragment>   
    );
}

export default (CommunicationsAnalytics);