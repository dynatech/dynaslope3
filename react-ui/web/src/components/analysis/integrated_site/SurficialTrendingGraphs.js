import React, { Fragment, useState, useEffect } from "react";

import Highcharts from "highcharts";
import highchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

import {
    Grid, Button, Paper, Divider, LinearProgress
} from "@material-ui/core";
import { ArrowDropUp } from "@material-ui/icons";

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
    const { site_code, marker_name, ts } = input;
    
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
            text: `Source: <b>Marker ${marker_name}</b><br/>Timestamp: <b>${moment(ts).format("D MMM YYYY, HH:mm")}</b>`,
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
    const { site_code, marker_name, ts } = input;
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
            text: `Source: <b>Marker ${marker_name}</b><br/>Timestamp: <b>${moment(ts).format("D MMM YYYY, HH:mm")}</b>`,
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
    const { site_code, marker_name, ts } = input;
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
            text: `Source: <b>Marker ${marker_name}</b><br/>Timestamp: <b>${moment(ts).format("D MMM YYYY, HH:mm")}</b>`,
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
        siteCode: site_code,
        generateTrending,
        setShowTrending, setGenerateTrending,
        chosenPoint
    } = props;
    const chartRef = React.useRef(null);
    const [trending_data, setTrendingData] = useState([]);
    const [graph_components, setGraphComponents] = useState([]);
    const [loading, setLoading] = useState(false);

    const { ts, name: marker_name } = chosenPoint;
    const input = {
        site_code,
        ts: moment(ts).format("YYYY-MM-DD HH:ss:mm"),
        marker_name
    };

    useEffect(() => {
        if (generateTrending) {
            setLoading(true);
            getSurficialMarkerTrendingData(input, data => {
                const { has_trend, trending_data: td } = data;
                const temp = has_trend ? [...td] : [];
                setTrendingData(temp);
                setGenerateTrending(false);
                setLoading(false);
            });
        }
    }, [generateTrending]);

    useEffect(() => {
        if (trending_data.length !== 0) {
            const gc = createSurficialTrendingGraphs(input, trending_data, chartRef);
            setGraphComponents(gc);
        }
    }, [trending_data]);

    return (
        <Fragment>
            <Grid item xs={12}>
                <Divider />
            </Grid>

            {
                loading ? (
                    <Grid item xs={12} style={{ marginTop: 16 }}>
                        <LinearProgress variant="query" style={{ height: 8 }}/>
                    </Grid>
                ) : (
                    <Fragment>
                        <Grid container item xs={12} justify="flex-end">                
                            <Button
                                variant="contained"
                                onClick={() => setShowTrending(false)}
                                color="primary"
                                size="small"
                                endIcon={<ArrowDropUp />}
                            >
                                Hide
                            </Button>
                        </Grid>

                        <Grid container item xs={12} justify="center" spacing={1}>
                            {
                                trending_data.length !== 0 ? (
                                    graph_components.map((graph, key) => (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Paper>
                                                {graph}
                                            </Paper>
                                        </Grid>
                                    ))
                                ) : (
                                    <Paper
                                        component={Grid}
                                        container
                                        item
                                        alignItems="center"
                                        justify="center"
                                        style={{
                                            height: "20vh", padding: 60,
                                            background: "gainsboro",
                                            border: "4px solid #CCCCCC"
                                        }}
                                    >
                                        Selected data has no trend.
                                    </Paper>
                                )
                            }
                        </Grid>
                    </Fragment>
                )
            }
        </Fragment>
    );
}

export default SurficialTrendingGraphs;
