import React, {
    Fragment, useState, useEffect,
    useRef, createRef
} from "react";

import Highcharts from "highcharts";
import HC_exporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import { Grid, Paper, Hidden } from "@material-ui/core";
import * as moment from "moment";
import { isWidthDown } from "@material-ui/core/withWidth";

import { getSubsurfacePlotData, saveChartSVG } from "../ajax";
import BackToMainButton from "./BackToMainButton";
import DateRangeSelector from "./DateRangeSelector";
import { computeForStartTs } from "../../../UtilityFunctions";

window.moment = moment;
HC_exporting(Highcharts);

function assignColorToEachSeries (data_array) {
    const size = data_array.length;
    const rainbow_colors = makeRainbowColors(size);
    const data = [...data_array];
    for (let i = 0; i < size; i += 1) {
        if (data_array[i].name !== "Cumulative") data[i].color = rainbow_colors[i];
    }
    return data;
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

        series_list[0].type = "area";
        const colored_data = assignColorToEachSeries(series_list);

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
    velocity_alerts.forEach(row => {
        const { orientation, data: series_list } = row;
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
    // console.log(set_data);
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
        time: { timezoneOffset: -8 * 60 },
        exporting: {
            sourceHeight: 800,
            sourceWidth: 600
        }
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
                month: "%e %b %Y",
                year: "%Y"
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
        time: { timezoneOffset: -8 * 60 },
        exporting: {
            sourceHeight: 800,
            sourceWidth: 600
        }
    };
}

function prepareVelocityAlertsOption (set_data, form) {
    const { data, orientation } = set_data;
    const { subsurface_column, ts_end } = form;

    const xAxisTitle = orientation === "across_slope" ? "Across Slope" : "Downslope";
    const categories = data.map(x => x.name).filter(x => typeof x === "number");
    categories.unshift(0);

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
                month: "%e %b %Y",
                year: "%Y"
            },
            title: {
                text: "<b>Time</b>"
            }
        },
        legend: {
            enabled: false
        },
        yAxis: {
            categories,
            reversed: true,
            title: {
                text: "<b>Nodes</b>"
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
        time: { timezoneOffset: -8 * 60 },
        exporting: {
            sourceHeight: 800,
            sourceWidth: 600
        }
    };
}


function SubsurfaceGraph (props) {
    const {
        match: { params: { tsm_sensor: sensor } },
        width, input: consolidated_input, disableBack,
        saveSVG, currentUser
    } = props;

    let ts_end = "";
    let dt_ts_end;
    let tsm_sensor = sensor;

    const default_range_info = { label: "3 days", unit: "days", duration: 3 };
    const [selected_range_info, setSelectedRangeInfo] = useState(default_range_info);
    const defaul_hour_interval = { label: "4 hours", hour_value: "4" };
    const [selected_hour_interval, setSelectedHourInterval] = useState(defaul_hour_interval);
    
    if (typeof consolidated_input !== "undefined") {
        const { ts_end: te, tsm_sensor: tsm } = consolidated_input;
        ts_end = te;
        dt_ts_end = moment(te);
        tsm_sensor = tsm;
    } else {
        const ts_now = moment();
        ts_end = ts_now.format("YYYY-MM-DD HH:mm:ss");
        dt_ts_end = ts_now;
    }

    const { unit, duration } = selected_range_info;
    const ts_start = computeForStartTs(dt_ts_end, duration, unit);
    
    const disable_back = typeof disableBack === "undefined" ? false : disableBack;
    const save_svg = typeof saveSVG === "undefined" ? false : saveSVG;

    const [processed_data, setProcessedData] = useState([]);
    const chartRefs = useRef([...Array(6)].map(() => createRef()));
    const [get_svg, setGetSVGNow] = useState(false);
    const [svg_list, setSVGList] = useState([]);

    const { hour_value } = selected_hour_interval;
    const input = { ts_end, ts_start, subsurface_column: tsm_sensor, hour_value };
    
    const is_desktop = isWidthDown(width, "sm");
    const default_options = { title: { text: "Loading" } };
    useEffect(() => { 
        setProcessedData([]);
        getSubsurfacePlotData(input, subsurface_data => {
            const processed = [];
            subsurface_data.forEach(({ type, data }) => {
                const sub = JSON.parse(JSON.stringify(data));
                let temp = [];
                if (type === "column_position") temp = plotColumnPosition(sub, type);
                else if (type === "displacement") temp = plotDisplacement(sub, type);
                else if (type === "velocity_alerts") temp = plotVelocityAlerts(sub, type);
                processed.push(...temp);
            });
            setProcessedData(processed);
        });
    }, [selected_range_info, selected_hour_interval]);

    const [options, setOptions] = useState([{ title: { text: "Loading" } }]); 
    
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
        if (temp.length > 0 && save_svg) setGetSVGNow(true);
    }, [processed_data]);

    useEffect(() => {
        if (get_svg) {
            const temp = [];
            chartRefs.current.forEach(ref => {
                const { current } = ref;
                if (current !== null) {
                    const { chart } = current;
                    const svg = chart.getSVGForExport();
                    temp.push(svg);
                }
            });
            setSVGList(temp);
        }
    }, [get_svg, chartRefs]);

    const svgRef = useRef(null);
    useEffect(() => {
        if (svg_list.length > 0) {
            const svg = svgRef.current.outerHTML;
            const temp = {
                user_id: currentUser.user_id,
                tsm_sensor,
                site_code: consolidated_input.site_code,
                chart_type: "subsurface",
                svg
            };

            saveChartSVG(temp, data => {});
        }
    }, [svg_list]);

    return (
        <Fragment>
            <Grid container spacing={1} justify="space-between">
                {
                    !disable_back && <BackToMainButton 
                        {...props}
                    />
                }

                <DateRangeSelector
                    isSubsurface
                    selectedRangeInfo={selected_range_info}
                    setSelectedRangeInfo={setSelectedRangeInfo}
                    selectedHourInterval={selected_hour_interval}
                    setSelectedHourInterval={setSelectedHourInterval}
                />
            </Grid>

            <div style={{ marginTop: 16 }}>
                <Grid container spacing={4}>
                    {
                        options.length === 0 && (
                            <Fragment>
                                <Grid item xs={12} md={6} key={1}>
                                    <Paper>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={default_options}
                                        />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6} key={2}>
                                    <Paper>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={default_options}
                                        />
                                    </Paper>
                                </Grid>
                            </Fragment>
                        )
                    }
                    {
                        options.map((option, i) => {
                            const chart_update = true;
                            const ref = chartRefs.current[i];
                            return (
                                <Grid item xs={12} md={6} key={i}>
                                    <Paper>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            allowChartUpdate={chart_update}
                                            options={option}
                                            ref={ref}
                                        />
                                    </Paper>
                                </Grid>
                            );
                        })
                    }
                </Grid>
            </div>

            {
                save_svg && (
                    <Hidden xsUp implementation="css">
                        <svg 
                            width={1200} height={2400}
                            viewBox="0 0 1200 2400"
                            ref={svgRef}
                        >
                            {
                                svg_list.map((c, index) => {
                                    const is_odd = index % 2 === 1;
                                    const x = is_odd ? 0 : 600;
                                    const y = (800 * (Math.floor(index / 2)));

                                    return (
                                        <Fragment key={index}>
                                            { /* eslint-disable-next-line react/no-danger */ }
                                            <svg x={x} y={y} dangerouslySetInnerHTML={{ __html: c }} />
                                        </Fragment>
                                    );
                                })
                            }
                        </svg>
                    </Hidden>
                )
            }
        </Fragment>
    );
}

export default SubsurfaceGraph;