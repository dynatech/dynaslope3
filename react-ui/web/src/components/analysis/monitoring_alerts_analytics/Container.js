import React, { 
    useState, useEffect,
    Fragment, useReducer
} from "react";
import {
    InputLabel, makeStyles, FormControl,
    Button, Select, MenuItem, Card, CardContent,
    Typography, CardActions, Grid, FormHelperText
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import Highcharts from "highcharts";
import GeneralStyles, { alert_1, alert_2, alert_3 } from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import PieChart from "./PieChart";
import StackedBarChart from "./StackedBarChart";
import { getMonitoringAnalyticsData } from "../ajax";

window.Highcharts = Highcharts;
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
        }
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

function listOfYears ( back = 7) {
    const year = new Date().getFullYear();
    return Array.from({ length: back }, (v, i) => year - back + i + 1);
}

function MonitoringAlertsAnalytics (props) {
    const classes = useStyles();
    const colors = [alert_1, alert_2, alert_3];
    const current_date_time = moment().format("YYYY-MM-DD HH:mm:ss");
    const [pie_chart_data, setPieChartData] = useState([]);
    const [stacked_chart_data, setStackedChartData] = useState([]);

    const pie_chart_initial_data = {
        site: "",
        start_ts: current_date_time,
        end_ts: current_date_time
    };

    const stacked_chart_initial_data = {
        site: "",
        year: moment().format("YYYY")
    };

    const [pie_chart_filter_data, dispatchPie] = useReducer(reducerFunction, pie_chart_initial_data, initReducer);
    const [stacked_chart_filter_data, dispatchStacked] = useReducer(reducerFunction, stacked_chart_initial_data, initReducer);
    const year_list = listOfYears();
    const update_start_ts = value => dispatchPie({ 
        type: "UPDATE",
        field: "start_ts",
        value: moment(value).format("YYYY-MM-DD HH:mm:ss") });
    const update_end_ts = value => dispatchPie({ 
        type: "UPDATE",
        field: "end_ts",
        value: moment(value).format("YYYY-MM-DD HH:mm:ss") });

    const updatePieChartSite = value => {
        dispatchPie({
            type: "UPDATE",
            field: "site",
            value
        });
    };

    const updateStackedBarSite = value => {
        dispatchStacked({
            type: "UPDATE",
            field: "site",
            value
        });
    };

    const submitFilter = type => () =>{
        let data_to_sanitize = pie_chart_filter_data;
        if (type === "stacked") {
            data_to_sanitize = stacked_chart_filter_data;
        }
        const sanitized_data = sanitizeData(data_to_sanitize);
        
        if (sanitized_data.site) {
            sanitized_data.site_id = sanitized_data.site.value;
        }
        const final_data = {
            chart_type: type,
            inputs: sanitized_data
        };
        
        getMonitoringAnalyticsData(final_data, data => {
            if (type === "pie") {
                setPieChartData(data);
            } else {
                setStackedChartData(data);
            }
        });
    };

    useEffect(() => {
        const pie_chart_input = {
            chart_type: "pie",
            inputs: pie_chart_initial_data
        };
        getMonitoringAnalyticsData(pie_chart_input, data => {
            setPieChartData(data);
        });

        const stacked_chart_input = {
            chart_type: "stacked",
            inputs: stacked_chart_initial_data
        };
        getMonitoringAnalyticsData(stacked_chart_input, data => {
            setStackedChartData(data);
        });
    }, []);


    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Monitoring Alerts Analytics"
                />
            </div>

            <div className={classes.pageContentMargin}>
                <Card className={classes.root}>
                    <CardContent>
                        <Typography variant="overline" display="block" gutterBottom>
                            Alert summary filter
                        </Typography>
                        <Grid container spacing={2} style={{ marginBottom: 16 }}>
                            <Grid item xs={12} sm={4} md={4}>
                                <DynaslopeSiteSelectInputForm
                                    value={pie_chart_filter_data.site.value}
                                    changeHandler={e => updatePieChartSite(e)}
                                    isClearable
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="Start Timestamp"
                                        value={pie_chart_filter_data.start_ts.value}
                                        onChange={update_start_ts}
                                        ampm={false}
                                        placeholder="2010/01/01 00:00"
                                        format="YYYY/MM/DD HH:mm"
                                        mask="____/__/__ __:__"
                                        clearable
                                        disableFuture
                                        fullWidth
                                    />
                                </MuiPickersUtilsProvider>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <KeyboardDateTimePicker
                                        required
                                        autoOk
                                        label="End Timestamp"
                                        value={pie_chart_filter_data.end_ts.value}
                                        onChange={update_end_ts}
                                        ampm={false}
                                        placeholder="2010/01/01 00:00"
                                        format="YYYY/MM/DD HH:mm"
                                        mask="____/__/__ __:__"
                                        clearable
                                        disableFuture
                                        fullWidth
                                    />
                                </MuiPickersUtilsProvider>
                                <Grid container justify="flex-end">
                                    <Button 
                                        size="small" 
                                        color="primary"
                                        onClick={submitFilter("pie")}>
                                        Submit
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </div>
            <div className={classes.pageContentMargin}>
                <Card className={classes.root}>
                    <CardContent>
                        <Grid container spacing={1} justify="space-between" alignItems="center">
                            <Grid item xs={12} sm={12} md={12}>
                                <PieChart
                                    highcharts={Highcharts}
                                    processed_data={pie_chart_data}
                                    colors={colors}
                                />
                                
                            </Grid>
                            
                        </Grid>
                    </CardContent>
                </Card>
            </div>
            <div className={classes.pageContentMargin}>
                <Card className={classes.root}>
                    <CardContent>
                        <Typography variant="overline" display="block" gutterBottom>
                            Alert per year filter
                        </Typography>
                        <Grid container spacing={2} style={{ marginBottom: 16 }}>
                            <Grid item xs={12} sm={4} md={4}>
                                <DynaslopeSiteSelectInputForm
                                    value={stacked_chart_filter_data.site.value || ""}
                                    changeHandler={e => updateStackedBarSite(e)}
                                    isClearable
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <FormControl required fullWidth>
                                    <InputLabel id="alert_level_label">Year</InputLabel>
                                    <Select
                                        labelId="alert_level_label"
                                        id="alert_level"
                                        value={stacked_chart_filter_data.year.value}
                                        onChange={e => dispatchStacked({ type: "UPDATE", field: "year", value: e.target.value })}
                                        error={Boolean(stacked_chart_filter_data.year.helper_text)}
                                                        
                                    >
                                        <MenuItem value="">
                                            <em>---</em>
                                        </MenuItem>
                                        {
                                            year_list.map(row => {
                                                return (
                                                    <MenuItem value={row} key={row}>{row}</MenuItem>
                                                );
                                            })
                                        }
                                    </Select>
                                    <FormHelperText error>{stacked_chart_filter_data.year.helper_text}</FormHelperText>
                                </FormControl>
                                <Grid container justify="flex-end">
                                    <Button 
                                        size="small" 
                                        color="primary"
                                        onClick={submitFilter("stacked")}>
                                        Submit
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </div>
            <div className={classes.pageContentMargin}>
                <Card className={classes.root}>
                    <CardContent>
                        <Grid container spacing={1} justify="space-between" alignItems="center">
                            <Grid item xs={12} sm={12} md={12}>
                                <StackedBarChart
                                    highcharts={Highcharts}
                                    processed_data={stacked_chart_data}
                                    colors={colors}
                                />
                            </Grid>
                            
                        </Grid>
                    </CardContent>
                </Card>
            </div>
        </Fragment>
    );
}

export default (MonitoringAlertsAnalytics);