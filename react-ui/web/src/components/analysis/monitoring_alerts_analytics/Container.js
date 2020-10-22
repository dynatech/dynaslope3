import React, { 
    useState, useEffect,
    Fragment, useReducer
} from "react";

import {
    InputLabel, makeStyles, FormControl,
    Button, Select, MenuItem, Card, CardContent,
    Typography, Grid, FormHelperText
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import MomentUtils from "@date-io/moment";
import moment from "moment";
import Highcharts from "highcharts";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";

import GeneralStyles, { alert_1, alert_2, alert_3 } from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import PieChart from "./PieChart";
import StackedBarChart from "./StackedBarChart";
import { getMonitoringAnalyticsData } from "../ajax";


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

function listOfYears (back = 5) {
    const year = new Date().getFullYear();
    return Array.from({ length: back }, (v, i) => year - back + i + 1);
}

function MonitoringAlertsAnalytics (props) {
    const classes = useStyles();
    const colors = [alert_1, alert_2, alert_3];
    const [pie_chart_data, setPieChartData] = useState({
        data: null,
        is_loading: true
    });
    const [stacked_chart_data, setStackedChartData] = useState({
        data: null,
        is_loading: true
    });

    const ts_now = moment();
    const ts_year_ago = ts_now.clone().subtract(1, "year");
    const pie_chart_initial_data = {
        site: "",
        start_ts: ts_year_ago,
        end_ts: ts_now
    };

    const stacked_chart_initial_data = {
        site: "",
        year: moment().format("YYYY")
    };

    const [pie_chart_filter_data, dispatchPie] = useReducer(reducerFunction, pie_chart_initial_data, initReducer);
    const [stacked_chart_filter_data, dispatchStacked] = useReducer(reducerFunction, stacked_chart_initial_data, initReducer);
    const year_list = listOfYears();
    const update_ts = (field, value) => dispatchPie({ 
        type: "UPDATE", field,
        value: moment(value).format("YYYY-MM-DD HH:mm:ss")
    });

    const updatePieChartSite = value => {
        dispatchPie({
            type: "UPDATE", field: "site", value
        });
    };

    const updateStackedBarSite = value => {
        dispatchStacked({
            type: "UPDATE", field: "site", value
        });
    };

    const setChartData = (type, data, is_loading = false) => {
        const temp = { data, is_loading };
        if (type === "pie") setPieChartData(temp);
        else if (type === "stacked") setStackedChartData(temp);
    };

    const submitFilter = type => () => {
        let data_to_sanitize;
        let temp_data;
        if (type === "pie") {
            temp_data = pie_chart_data.data;
            data_to_sanitize = pie_chart_filter_data;
        } else if (type === "stacked") {
            temp_data = stacked_chart_data.data;
            data_to_sanitize = stacked_chart_filter_data;
        }

        setChartData(type, temp_data, true);
        const sanitized_data = sanitizeData(data_to_sanitize);
        
        if (sanitized_data.site) {
            sanitized_data.site_id = sanitized_data.site.value;
        }
        const final_data = {
            chart_type: type,
            inputs: sanitized_data
        };
        
        getMonitoringAnalyticsData(final_data, data => {
            setChartData(type, data);
        });
    };

    useEffect(() => {
        const input_arr = [
            {
                chart_type: "pie",
                inputs: pie_chart_initial_data
            },
            {
                chart_type: "stacked",
                inputs: stacked_chart_initial_data
            }
        ];

        input_arr.forEach(row => {
            getMonitoringAnalyticsData(row, data => {
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
                    <Grid item xs={12} md={4}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Alerts Summary
                                </Typography>

                                <Grid container spacing={2} justify="space-between">
                                    <Grid item xs={12} sm={6} md={12}>
                                        <DynaslopeSiteSelectInputForm
                                            value={pie_chart_filter_data.site.value}
                                            changeHandler={e => updatePieChartSite(e)}
                                            isClearable
                                            customPlaceholder="If no input, all sites"
                                        />
                                    </Grid>

                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                        <Grid item xs={12} sm={3} md={12}>
                                            <KeyboardDateTimePicker
                                                required
                                                autoOk
                                                label="Start Timestamp"
                                                value={pie_chart_filter_data.start_ts.value}
                                                onChange={e => update_ts("start_ts", e)}
                                                ampm={false}
                                                placeholder="2010/01/01 00:00"
                                                format="YYYY/MM/DD HH:mm"
                                                mask="____/__/__ __:__"
                                                clearable
                                                disableFuture
                                                fullWidth
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={3} md={12}>
                                            <KeyboardDateTimePicker
                                                required
                                                autoOk
                                                label="End Timestamp"
                                                value={pie_chart_filter_data.end_ts.value}
                                                onChange={e => update_ts("end_ts", e)}
                                                ampm={false}
                                                placeholder="2010/01/01 00:00"
                                                format="YYYY/MM/DD HH:mm"
                                                mask="____/__/__ __:__"
                                                clearable
                                                disableFuture
                                                fullWidth
                                            />
                                        </Grid>
                                    </MuiPickersUtilsProvider>

                                    <Grid item xs={12} align="right">
                                        <Button 
                                            size="small" 
                                            color="primary"
                                            variant="contained"
                                            onClick={submitFilter("pie")}>
                                            Submit
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={8}>   
                        <Card className={classes.card}>
                            <CardContent>
                                <PieChart
                                    highcharts={Highcharts}
                                    data={pie_chart_data.data}
                                    isLoading={pie_chart_data.is_loading}
                                    colors={colors}
                                    input={sanitizeData(pie_chart_filter_data)}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Monthly Alerts Per Year
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={8} md={12}>
                                        <DynaslopeSiteSelectInputForm
                                            value={stacked_chart_filter_data.site.value || ""}
                                            changeHandler={e => updateStackedBarSite(e)}
                                            isClearable
                                            customPlaceholder="If no input, all sites"
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4} md={12}>
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
                                    </Grid>
                        
                                    <Grid item xs={12} align="right">
                                        <Button 
                                            size="small" 
                                            color="primary"
                                            onClick={submitFilter("stacked")}
                                            variant="contained"
                                        >
                                            Submit
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Grid container spacing={1} justify="space-between" alignItems="center">
                                    <Grid item xs={12}>
                                        <StackedBarChart
                                            highcharts={Highcharts}
                                            data={stacked_chart_data.data}
                                            isLoading={stacked_chart_data.is_loading}
                                            colors={colors}
                                            input={sanitizeData(stacked_chart_filter_data)}
                                        />
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

export default (MonitoringAlertsAnalytics);