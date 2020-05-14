import React, { Fragment, useState, useEffect } from "react";

import Highcharts from "highcharts";
import highchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

import { Button, ButtonGroup, withStyles, IconButton, Paper } from "@material-ui/core";

import GeneralStyles from "../../../GeneralStyles";
import { getSurficialMarkerTrendingData } from "../ajax";

highchartsMore(Highcharts);

Highcharts.SVGRenderer.prototype.symbols.asterisk = (x, y, w, h) =>
    [
        "M", x - 3, y - 3,
        "L", x + w + 3, y + h + 3,
        "M", x + w + 3, y - 3,
        "L", x - 3, y + h + 3,
        "M", x - 4, y + h / 2,
        "L", x + w + 4, y + h / 2,
        "M", x + w / 2, y - 4,
        "L", x + w / 2, y + h + 4,
        "z"
    ];

if (Highcharts.VMLRenderer) {
    Highcharts.VMLRenderer.prototype.symbols.asterisk =
            Highcharts.SVGRenderer.prototype.symbols.asterisk;
}

function prepareMarkerAccelerationVsTimeChartOption (data, timestamps, input) {
    const { site_code, marker_name, end_date } = input;
    
    return {
        series: data,
        chart: {
            type: "line",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            }
        },
        title: {
            text: `<b>Velocity & Acceleration vs Time Chart of ${(site_code).toUpperCase()}</b>`,
            y: 22
        },
        subtitle: {
            text: `Source: <b>Marker ${marker_name}</b><br/>As of: <b>${moment(end_date).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "13px" }
        },
        xAxis: {
            categories: timestamps,
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e. %b %Y",
                year: "%b"
            },
            labels: {
                formatter () {
                    return moment(this.value).format("D MMM");
                }
            },
            title: {
                text: "<b>Time (Days)</b>"
            }
        },
        yAxis: [{
            title: {
                text: "<b>Velocity (cm/day)</b>",
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            }
        }, {
            title: {
                text: "<b>Acceleration (cm/days^2)</b>",
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            opposite: true
        }],
        tooltip: {
            shared: true,
            crosshairs: true
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: false
                }
            }
        },
        credits: {
            enabled: false
        }
    };
}

function prepareMarkerInterpolationChartOption (data, input) {
    const { site_code, marker_name, end_date } = input;
    return {
        series: data,
        time: { timezoneOffset: -8 * 60 },
        chart: {
            type: "spline",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            }
        },
        title: {
            text: `<b>Displacement Interpolation Chart of ${(site_code).toUpperCase()}</b>`,
            y: 22
        },
        subtitle: {
            text: `Source: <b>Marker ${marker_name}</b><br/>As of: <b>${moment(end_date).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "13px" }
        },
        xAxis: {
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e. %b %Y",
                year: "%b"
            },
            title: {
                text: "<b>Date</b>"
            }
        },
        yAxis: {
            title: {
                text: "<b>Displacement (cm)</b>"
            }
        },
        tooltip: {
            crosshairs: true
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true
                }
            },
            scatter: {
                tooltip: {
                    pointFormat: "Date/Time: <b>{point.x:%A, %e %b, %H:%M:%S}</b><br>Displacement: <b>{point.y:.2f}</b>"
                }
            }
        },
        credits: {
            enabled: false
        }
    };
}

function prepareMarkerAccelerationChartOption (data, input) {
    const { site_code, marker_name, ts_end } = input;
    return {
        series: data,
        time: { timezoneOffset: -8 * 60 },
        chart: {
            type: "line",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            }
        },
        title: {
            text: `<b>Velocity Acceleration Chart of ${(site_code).toUpperCase()}</b>`,
            y: 22
        },
        subtitle: {
            text: `Source: <b>Marker ${marker_name}</b><br/>As of: <b>${moment(ts_end).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "13px" }
        },
        xAxis: {
            title: {
                text: "<b>Velocity (cm/day)</b>"
            }
        },
        yAxis: {
            title: {
                text: "<b>Acceleration (cm/day^2)</b>"
            }
        },
        tooltip: {
            headerFormat: "",
            shared: true,
            crosshairs: true
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        }
    };
}

function processDatasetForPlotting (data) {
    const { dataset_name, dataset } = data;
    
    if (dataset_name === "velocity_acceleration") {
        dataset.forEach(({ name }, index) => {
            if (name === "Trend Line") {
                dataset[index] = {
                    ...dataset[index],
                    type: "spline"
                };
            } else if (name === "Threshold Interval") {
                dataset[index] = {
                    ...dataset[index],
                    type: "arearange",
                    lineWidth: 0,
                    fillOpacity: 0.2,
                    zIndex: 0,
                    color: "#FFEB32"
                };
            } else if (name === "Last Data Point") {
                dataset[index] = {
                    ...dataset[index],
                    marker: {
                        symbol: "asterisk",
                        lineColor: "#ff9e32",
                        lineWidth: 4
                    }
                };
            }
        });
    } else if (dataset_name === "displacement_interpolation") {
        dataset.forEach(({ name }, index) => {
            if (name === "Surficial Data") {
                dataset[index].type = "scatter";
            } else if (name === "Interpolation") {
                dataset[index] = { ...dataset[index], marker: { enabled: true, radius: 0 } };
            }
        });
    } else if (dataset_name === "velocity_acceleration_time") {
        dataset.forEach(({ name }, index) => {
            if (name === "Velocity") {
                dataset[index].yAxis = 0;
            } else if (name === "Acceleration") {
                dataset[index].yAxis = 1;
            }
        });
    }
    return dataset;
}

function prepareOptions (input, data) {
    const options = [];

    if (data.length === 0) {
        options[0] = {
            chart: { type: "bar" },
            series: []
        };
    } else {
        data.forEach((chart_data) => {
            const { dataset_name } = chart_data;
            const series = processDatasetForPlotting(chart_data);

            let option;
            if (dataset_name === "velocity_acceleration") {
                option = prepareMarkerAccelerationChartOption(series, input);
            } else if (dataset_name === "displacement_interpolation") {
                option = prepareMarkerInterpolationChartOption(series, input);
            } else if (dataset_name === "velocity_acceleration_time") {
                const index = series.findIndex(x => x.name === "Timestamps");
                const series_copy = JSON.parse(JSON.stringify(series));
                const [timestamps] = series_copy.splice(index, 1);
                option = prepareMarkerAccelerationVsTimeChartOption(series_copy, timestamps.data, input);
            }
            options.push(option);
        });
    }

    return options;
}

function createSurficialTrendingGraphs (input, trending_data, chartRef) {
    const options = prepareOptions(input, trending_data);

    const charts = options.map(option => (
        <HighchartsReact
            highcharts={Highcharts}
            options={option}
            ref={chartRef}
        />
    ));

    return charts;
}

function SurficialTrendingGraphs (props) {
    const { 
        classes, timestamps, hideTrending, history,
        match: { url, params: { marker_name } },
        siteCode: site_code, trendingData: trending_data,
        setTrendingData
    } = props;
    const chartRef = React.useRef(null);
    
    const [has_trend, setHasTrend] = useState(true);
    
    const input = {
        site_code, marker_name, 
        ts_end: timestamps.end,
        ts_start: timestamps.start
    };

    useEffect(() => {
        if (chartRef !== null) {
            const { current } = chartRef;
            if (current !== null)
                current.chart.showLoading();

            getSurficialMarkerTrendingData(input, data => {
                const { has_trend: ht, trending_data: td } = data;

                if (current !== null) {
                    const { chart } = current;
                    if (ht) {
                        setTrendingData([...td]);
                    } else {
                        setHasTrend(false);
                    }
                    chart.hideLoading();
                }
            });
        }
    }, [marker_name]);

    const graph_components = createSurficialTrendingGraphs(input, trending_data, chartRef);

    return (
        <Fragment>
            <div style={{ textAlign: "right", marginTop: 24 }}>                
                <Button
                    variant="contained"
                    onClick={hideTrending(history)}
                    color="primary"
                    size="small"
                >
                    Hide
                </Button>
            </div>

            {
                has_trend ? (
                    graph_components.map((graph, key) => (
                        <div style={{ marginTop: 24 }} key={key}>
                            <Paper>
                                {graph}
                            </Paper>
                        </div>
                    ))
                ) : (
                    "No trend"
                )
            }
        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SurficialTrendingGraphs);
