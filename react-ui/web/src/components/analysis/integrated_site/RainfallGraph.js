import React, { Fragment, useState, useEffect } from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import * as moment from "moment";

import { Grid, Paper } from "@material-ui/core";
import BackToMainButton from "./BackToMainButton";

import { getRainfallPlotData } from "../ajax";
import { computeForStartTs } from "../../../UtilityFunctions";

window.moment = moment;

const rainfall_colors = {
    "24h": "rgba(73, 105, 252, 0.9)",
    "72h": "rgba(239, 69, 50, 0.9)",
    rain: "rgba(0, 0, 0, 0.9)"
};

function prepareRainfallData (set) {
    const { null_ranges } = set;  
    const series_data = [];
    const max_rval_data = [];

    Object.keys(rainfall_colors).forEach((name) => {
        const color = rainfall_colors[name];
        const entry = {
            name,
            step: true,
            data: set[name],
            color,
            id: name,
            fillOpacity: 1,
            lineWidth: 1
        };

        if (name !== "rain") series_data.push(entry);
        else max_rval_data.push(entry);
    });

    const null_processed = null_ranges.map(({ from, to }) => ({ from, to, color: "rgba(68, 170, 213, 0.3)" }));

    return { set, series_data, max_rval_data, null_processed };
}

function prepareInstantaneousRainfallChartOption (row, input) {
    const { set, max_rval_data, null_processed } = row;
    const {
        distance, max_rval, gauge_name
    } = set;
    const { ts_start, ts_end, site_code } = input;

    return {
        series: max_rval_data,
        chart: {
            type: "column",
            zoomType: "x",
            panning: true,
            // height: 400,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            },
            spacingTop: 16,
            spacingRight: 24
        },
        title: {
            text: `<b>Instantaneous Rainfall Chart of ${site_code.toUpperCase()}</b>`,
            style: { fontSize: "0.85rem" },
            margin: 26,
            y: 20
        },
        subtitle: {
            text: `Source : <b>${createRainPlotSubtitle(distance, gauge_name)}</b><br/>As of: <b>${moment(ts_end).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "0.65rem" }
        },
        xAxis: {
            min: Date.parse(ts_start),
            max: Date.parse(ts_end),
            plotBands: null_processed,
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e %b %Y",
                year: "%Y"
            },
            title: {
                text: "<b>Date</b>"
            },
            events: {
                setExtremes: syncExtremes
            }
        },
        yAxis: {
            max: max_rval,
            min: 0,
            title: {
                text: "<b>Value (mm)</b>"
            }
        },
        tooltip: {
            shared: true,
            crosshairs: true
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 3
                },
                cursor: "pointer"
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        time: { timezoneOffset: -8 * 60 }
    };
}

function prepareCumulativeRainfallChartOption (row, input) {
    const { set, series_data } = row;
    const {
        distance, max_72h, 
        threshold_value: max_rain_2year, gauge_name
    } = set;
    const { ts_start, ts_end, site_code } = input;
    
    return {
        series: series_data,
        chart: {
            type: "line",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            // height: 400,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            },
            spacingTop: 16,
            spacingRight: 24
        },
        title: {
            text: `<b>Cumulative Rainfall Chart of ${site_code.toUpperCase()}</b>`,
            style: { fontSize: "0.85rem" },
            margin: 26,
            y: 20
        },
        subtitle: {
            text: `Source: <b>${createRainPlotSubtitle(distance, gauge_name)}</b><br/>As of: <b>${moment(ts_end).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "0.65rem" }
        },
        xAxis: {
            min: Date.parse(ts_start),
            max: Date.parse(ts_end),
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e %b %Y",
                year: "%Y"
            },
            title: {
                text: "<b>Date</b>"
            },
            events: {
                setExtremes: syncExtremes
            }
        },
        yAxis: {
            title: {
                text: "<b>Value (mm)</b>"
            },
            max: Math.max(0, (max_72h - parseFloat(max_rain_2year))) + parseFloat(max_rain_2year),
            min: 0,
            plotBands: [{
                value: Math.round(parseFloat(max_rain_2year / 2) * 10) / 10,
                color: rainfall_colors["24h"],
                dashStyle: "shortdash",
                width: 2,
                zIndex: 0,
                label: {
                    text: `24-hr threshold (${max_rain_2year / 2})`
    
                }
            }, {
                value: max_rain_2year,
                color: rainfall_colors["72h"],
                dashStyle: "shortdash",
                width: 2,
                zIndex: 0,
                label: {
                    text: `72-hr threshold (${max_rain_2year})`
                }
            }]
        },
        tooltip: {
            shared: true,
            crosshairs: true
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 3
                },
                cursor: "pointer"
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        time: { timezoneOffset: -8 * 60 }
    };
}

function RainfallGraph (props) {
    const { 
        match: { params: { rain_gauge, site_code } },
        input: conso_input, disableBack
    } = props;
    // const rainfall_data = sample_rain_data;
    // const input = { ts_end: "2019-06-24 01:00:00", ts_start: "2019-06-17 01:00:00", site_code: "AGB" };
    const [rainfall_data, setRainfallData] = useState([]);
    const [processed_data, setProcessedData] = useState([]);

    const disable_back = typeof disableBack === "undefined" ? false : disableBack;

    let ts_end = "";
    let sc = "";
    let dt_ts_end;
    if (typeof conso_input !== "undefined") {
        const { ts_end: te } = conso_input;
        ts_end = te;
        dt_ts_end = moment(te);
        sc = site_code;
    } else {
        const ts_now = moment();
        ts_end = ts_now.format("YYYY-MM-DD HH:mm:ss");
        dt_ts_end = ts_now;
        sc = rain_gauge.substr(0, 3);
    }

    const ts_start = computeForStartTs(dt_ts_end, 3, "days");

    const input = { ts_start, ts_end, site_code: sc };

    useEffect(() => {
        getRainfallPlotData(input, data => {
            let arr = data;
            if (typeof rain_gauge !== "undefined") {
                arr = data.filter(row => row.gauge_name === `rain_${rain_gauge}`);
            }
            setRainfallData(arr);
        });
    }, []);

    useEffect(() => {
        const temp = [];
        rainfall_data.forEach(set => {
            const data = prepareRainfallData(set);
            temp.push(data);
        });
        setProcessedData(temp);
    }, [rainfall_data]);

    const [options, setOptions] = useState([]);

    useEffect(() => {
        const temp = [];
        processed_data.forEach(data => {
            const instantaneous = prepareInstantaneousRainfallChartOption(data, input);
            const cumulative = prepareCumulativeRainfallChartOption(data, input);
            temp.push({ instantaneous, cumulative });
        });
        setOptions(temp);
    }, [processed_data]);

    return (
        <Fragment>
            {
                !disable_back && <BackToMainButton {...props} />
            }

            <div style={{ marginTop: 16 }}>
                <Grid container spacing={4}>
                    {
                        options.map((option, i) => {
                            const { instantaneous, cumulative } = option;
                            return (
                                <Fragment key={i}>
                                    <Grid item xs={12} md={6}>
                                        <Paper>
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={instantaneous}
                                            />
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Paper>
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={cumulative}
                                            />
                                        </Paper>
                                    </Grid>
                                </Fragment>
                            );
                        })
                    }
                </Grid>
            </div>
        </Fragment>
    );
}

export default RainfallGraph;

function createRainPlotSubtitle (distance, gauge_name) {
    const source = gauge_name.toUpperCase();
    const subtitle = distance === null ? source : `${source} (${distance} KM)`;
    return subtitle;
}

/**
 * Synchronize zooming through the setExtremes event handler.
 */
function syncExtremes (e) {
    const this_chart = this.chart;
    const { charts } = Highcharts;

    if (e.trigger !== "syncExtremes") { // Prevent feedback loop
        Highcharts.each(charts, (chart) => {
            if (chart !== this_chart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: "syncExtremes" });
                }
            }
        });
    }
}
