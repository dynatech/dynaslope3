import React, { Fragment, useState, useEffect } from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Button, withStyles, Grid, Paper } from "@material-ui/core";
import moment from "moment";

import { isWidthDown } from "@material-ui/core/withWidth";
import GeneralStyles from "../../../GeneralStyles";
import { getSubsurfacePlotData } from "../ajax";
import BackToMainButton from "./BackToMainButton";


function plotColumnPosition (column_data, type) {
    const { data: data_list } = column_data;
    const col_position_data = [];
    data_list.forEach(({ orientation, data: series_list }) => {
        const colored_data = assignColorToEachSeries(series_list);
        const col_data = { 
            ...column_data,
            data: colored_data,
            orientation,
            type
        };
        col_position_data.push(col_data);
    });

    return col_position_data;
}

function plotDisplacement (column_data, type) {
    const displacement_data = [];
    column_data.forEach((data_list, index) => {
        const { data: series_list, annotations } = data_list;

        const colored_data = assignColorToEachSeries(series_list);
        series_list[0].type = "area";

        annotations.forEach((line) => {
            line.width = 0;
            line.label.style = { color: "gray" };
        });

        const col_data = {
            ...data_list,
            data: colored_data,
            annotations,
            type
        };

        displacement_data.push(col_data);
    });

    return displacement_data;
}

function plotVelocityAlerts (column_data, type) {
    const { velocity_alerts, timestamps_per_node } = column_data;
    const velocity_data = [];
    const processed_data = assignColorToEachSeries(timestamps_per_node);
    velocity_alerts.forEach(({ orientation, data: series_list }) => {
        const alerts = series_list;
        const colored_data = [...processed_data];
        Object.keys(alerts).forEach((alert) => {
            const radius = alert === "L2" ? 7 : 10;
            const color = alert === "L2" ? "#FFFF00" : "#FF0000";
            const series = {
                data: alerts[alert],
                type: "scatter",
                zIndex: 5,
                name: alert,
                marker: {
                    symbol: "triangle",
                    radius,
                    fillColor: color,
                    lineColor: "#000000",
                    lineWidth: 2
                }
            };
            colored_data.push(series);
        });

        const col_data = {
            data: colored_data,
            type,
            orientation
        };

        velocity_data.push(col_data);
    });

    return velocity_data;
}

function prepareColumnPositionChartOption (set_data, input, is_desktop) {
    const { data, max_position, min_position, orientation } = set_data;
    const { subsurface_column } = input;
    const xAxisTitle = orientation === "across_slope" ? "Across Slope" : "Downslope";

    return {
        series: data,
        chart: {
            type: "scatter",
            zoomType: "x",
            height: 600,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            },
            spacingTop: 20,
            spacingRight: 24
        },
        title: {
            text: `<b>Column Position Plot of ${subsurface_column.toUpperCase()}</b>`,
            style: { fontSize: "1rem" }
        },
        plotOptions: {
            series: {
                lineWidth: 2,
                states: {
                    hover: {
                        enabled: true,
                        lineWidth: 5
                    }
                },
                marker: {
                    enabled: true,
                    radius: 3,
                    lineColor: null
                }
            }
        },
        tooltip: {
            formatter () {
                return `Timestamp: <b>${moment(this.series.name).format("dddd, MMM D, HH:mm")}</b><br>Depth: <b>${this.y}</b><br>Displacement: <b>${this.x}</b>`;
            }
        },
        xAxis: {
            min: min_position,
            max: (max_position + 0.02),
            gridLineWidth: 1,
            title: {
                text: `<b>Horizontal displacement, ${xAxisTitle} (m)</b>`
            }
        },
        yAxis: {
            title: {
                text: "<b>Depth (m)</b>"
            }
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: true,
            align: is_desktop ? "right" : "center",
            layout: is_desktop ? "vertical" : "horizontal",
            verticalAlign: is_desktop ? "middle" : "bottom",
            labelFormatter () {
                return `${moment(this.name).format("MM/DD, HH:mm")}`;
            }
        },
        time: { timezoneOffset: -8 * 60 }
    };
}

function prepareDisplacementChartOption (set_data, form) {
    const { orientation, data, annotations } = set_data;
    const { subsurface_column, ts_end } = form;
    const xAxisTitle = orientation === "across_slope" ? "Across Slope" : "Downslope";

    return {
        series: data,
        chart: {
            type: "line",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            height: 600,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            },
            spacingTop: 20,
            spacingRight: 24
        },
        title: {
            text: `<b>Displacement Plot, ${xAxisTitle} of ${(subsurface_column).toUpperCase()}</b>`,
            style: { fontSize: "1rem" },
            margin: 20,
            y: 16
        },
        subtitle: {
            text: `As of: <b>${moment(ts_end).format("D MMM YYYY, HH:mm")}</b><br><br><b>Note: </b> (+/-) consistently increasing/decreasing trend`,
            style: { fontSize: "0.6rem" }
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
            plotBands: annotations,
            title: {
                text: "<b>Relative Displacement (mm)</b>"
            }
        },
        tooltip: {
            header: "{point.x:%Y-%m-%d}: {point.y:.2f}"
        },
        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        time: { timezoneOffset: -8 * 60 }
    };
}

function prepareVelocityAlertsOption (set_data, form) {
    const { data, orientation } = set_data;
    const { subsurface_column, ts_end } = form;

    const xAxisTitle = orientation === "across_slope" ? "Across Slope" : "Downslope";
    const category = data.map(x => x.name + 1);

    return {
        series: data,
        chart: {
            type: "line",
            zoomType: "x",
            panning: true,
            panKey: "shift",
            height: 600,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -30
                }
            },
            spacingTop: 20,
            spacingRight: 24
        },
        title: {
            text: `<b>Velocity Alerts Plot, ${xAxisTitle} of ${subsurface_column.toUpperCase()}</b>`,
            style: { fontSize: "1rem" },
            margin: 20,
            y: 16
        },
        subtitle: {
            text: `As of: <b>${moment(ts_end).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "0.6rem" }
        },
        credits: {
            enabled: false
        },
        xAxis: {
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e. %b %Y",
                year: "%b"
            },
            title: {
                text: "<b>Time</b>"
            }
        },
        legend: {
            enabled: false
        },
        yAxis: {
            categories: category,
            reversed: true,
            title: {
                text: "<b>Depth (m)</b>"
            },
            labels: {
                formatter () {
                    return this.value;
                }
            }
        },
        tooltip: {
            formatter () {
                return `<b>${moment(this.x).format("DD MMM YYYY, HH:mm")}</b>`;
            }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    radius: 2
                }
            }
        },
        time: { timezoneOffset: -8 * 60 }
    };
}

function SubsurfaceGraph (props) {
    const { classes, history, match: { params: { tsm_sensor } }, width } = props;
    const [timestamps, setTimestamps] = useState({ start: "2019-06-24 01:00:00", end: "2019-06-17 01:00:00" });
    const [processed_data, setProcessedData] = useState([]);
    const input = { ts_end: timestamps.end, ts_start: timestamps.start, subsurface_column: tsm_sensor };
    const is_desktop = isWidthDown(width, "sm");

    useEffect(() => {
        getSubsurfacePlotData(input, subsurface_data => {
            subsurface_data.forEach(({ type, data }) => {
                let temp = [];
                if (type === "column_position") temp = plotColumnPosition(data, type);
                else if (type === "displacement") temp = plotDisplacement(data, type);
                else if (type === "velocity_alerts") temp = plotVelocityAlerts(data, type);
                setProcessedData(prev => [...prev, ...temp]);
            });
        });
    }, [timestamps]);

    const [options, setOptions] = useState([]);
    useEffect(() => {
        const temp = [];
        processed_data.forEach(data => {
            const { type } = data;
            let option;
            if (type === "column_position") option = prepareColumnPositionChartOption(data, input, is_desktop);
            else if (type === "displacement") option = prepareDisplacementChartOption(data, input);
            else if (type === "velocity_alerts") option = prepareVelocityAlertsOption(data, input);
            temp.push(option);
        });

        setOptions(temp);
    }, [processed_data]);

    return (
        <Fragment>
            <BackToMainButton {...props} />

            <div style={{ marginTop: 16 }}>
                <Grid container spacing={4}>
                    {
                        options.map((option, i) => {
                            return (
                                <Grid item xs={12} md={6} key={i}>
                                    <Paper>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={option}
                                        />
                                    </Paper>
                                </Grid>
                            );
                        })
                    }
                </Grid>
            </div>
        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SubsurfaceGraph);

function assignColorToEachSeries (data_array) {
    const size = data_array.length;
    const rainbow_colors = makeRainbowColors(size);
    for (let i = 0; i < size; i += 1) {
        if (data_array[i].name !== "Cumulative") data_array[i].color = rainbow_colors[i];
    }
    return data_array;
}

let rainbow_colors = [];
function makeRainbowColors (size) {
    const rainbow = [...rainbow_colors];
    if (rainbow.length !== size) {
        for (let i = 0; i < size; i += 1) {
            const obj = { index: i, size };
            const red = sinToHex(obj, 2 * Math.PI * 2 / 3);
            const blue = sinToHex(obj, 1 * Math.PI * 2 / 3);
            const green = sinToHex(obj, 0 * Math.PI * 2 / 3);
            rainbow[i] = `#${red}${green}${blue}`;
        }
        rainbow_colors = [...rainbow];
    }
    return rainbow;
}

function sinToHex ({ index, size }, phase) {
    const sin = Math.sin(Math.PI / size * 2 * index + phase);
    const int = Math.floor(sin * 127) + 128;
    const hex = int.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
}