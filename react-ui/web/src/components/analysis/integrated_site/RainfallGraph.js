import React, {
    Fragment, useState, useEffect,
    useRef, createRef
} from "react";

import Highcharts from "highcharts";
import HC_exporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import * as moment from "moment";

import { Grid, Paper, Hidden } from "@material-ui/core";
import BackToMainButton from "./BackToMainButton";
import DateRangeSelector from "./DateRangeSelector";
import RainfallDataTaggingModal from "./RainfallDataTaggingModal";

import { getRainfallPlotData, saveChartSVG } from "../ajax";
import { computeForStartTs } from "../../../UtilityFunctions";

window.moment = moment;
HC_exporting(Highcharts);

const default_data = {
    set: {
        "24h": [],
        "72h": [],
        rain: [],
        null_ranges: [],
        max_rval: 0,
        max_72h: 0,
        gauge_name: "loading",
        distance: 0,
        data_source: "loading",
        threshold_value: 0,
        rain_id: null
    },
    series_data: [],
    max_rval_data: []
};

const observed_data_dict = {
    "-1": "Actual is lower than recorded",
    "0": "No rainfall/Data is zero",
    "1": "Actual is higher than recorded"
};

const rainfall_colors = {
    "24h": "rgba(73, 105, 252, 0.9)",
    "72h": "rgba(239, 69, 50, 0.9)",
    rain: "rgba(0, 0, 0, 0.9)"
};

function processInstantaneousRainData (data, invalid_data) {
    const { length: inv_len } = invalid_data;
    let i = 0;
    const transformed = data.map(row => {
        const [x, y] = row;
        const obj = { x, y };

        if (inv_len > 0 && i < inv_len) {
            const { ts_start, ts_end } = invalid_data[i];

            const ts = moment.unix(x / 1000);
            if (ts.isSameOrAfter(ts_start) && (
                ts.isSameOrBefore(ts_end) || ts_end === null
            )) {
                obj.color = "rgba(250, 96, 96)";
                obj.is_invalid = true;
                Object.assign(obj, invalid_data[i]);
            }

            if (ts.isSame(ts_end)) i += 1;
        }

        return obj;
    });

    return transformed;
}

function prepareRainfallData (set) {
    const { null_ranges, invalid_data } = set;
    const series_data = [];
    const max_rval_data = [];

    Object.keys(rainfall_colors).forEach((name) => {
        const color = rainfall_colors[name];

        let data = set[name];
        if (name === "rain") {
            data = processInstantaneousRainData(data, invalid_data);
        }

        const entry = {
            name,
            step: true,
            data,
            color,
            id: name,
            fillOpacity: 1,
            lineWidth: 1,
            turboThreshold: 100000
        };

        if (name !== "rain") series_data.push(entry);
        else max_rval_data.push(entry);
    });

    const null_processed = null_ranges.map(({ from, to }) => ({ from, to, color: "rgba(68, 170, 213, 0.3)" }));

    return { set, series_data, max_rval_data, null_processed };
}

function selectPointsByDrag (e) {
    const { target, is_tagging_data, rain_gauge: rg, rain_id: rd, setTaggingData: std } = e;
    const {
        series, resetZoomButton,
        is_tagging_data: target_itd, rain_gauge: target_rain_gauge,
        rain_id: target_rain_id, tagging_sign, setTaggingData: target_std
    } = target;

    const rain_gauge = target_rain_gauge;
    const rain_id = target_rain_id;
    if (typeof rg !== "undefined") {
        target.rain_gauge = rg;
        target.rain_id = rd;
    }

    const setTaggingData = target_std;
    if (typeof std !== "undefined") target.setTaggingData = std;

    const is_itd_undef = typeof target_itd === "undefined";
    const temp = is_itd_undef ? false : target_itd;
    const is_tagging = typeof is_tagging_data === "undefined" ? temp : is_tagging_data;
    target.is_tagging_data = is_tagging;

    const destroyResetSelection = () => {
        target.reset_selection.destroy();
        delete target.reset_selection;
    };

    const destroySubmitSelection = () => {
        target.submit_selection.destroy();
        delete target.submit_selection;
    };

    // if (typeof reset_selection === "undefined" && typeof submit_selection === "undefined") {
    target.submit_selection = target.renderer.button("Submit", 70, 65)
    .attr({
        zIndex: 3,
        r: 5,
        id: "submit-selection",
        fill: Highcharts.getOptions().colors[0],
    })
    .css({
        color: "#FFFFFF"
    })
    .on("click", () => {
        Highcharts.fireEvent(target, "selectedpoints", {
            selected_points: target.getSelectedPoints(),
            rain_gauge, rain_id, is_submit: true,
            setTaggingData
        });
        destroyResetSelection();
        destroySubmitSelection();
        unselectPoints(series);
    });

    target.reset_selection = target.renderer.button("Reset", 133, 65)
    .attr({
        zIndex: 3,
        r: 5,
        id: "reset-selection",
        fill: Highcharts.getOptions().colors[0],
    })
    .css({
        color: "#FFFFFF"
    })
    .on("click", () => {
        destroyResetSelection();
        destroySubmitSelection();
        unselectPoints(series);
    });
    // }

    if (typeof resetZoomButton !== "undefined") {
        if (is_tagging) resetZoomButton.hide();
        else resetZoomButton.show();
    }

    if (!is_tagging) {
        unselectPoints(series);
        // if (typeof reset_selection !== "undefined" && typeof submit_selection !== "undefined") {
        destroyResetSelection();
        destroySubmitSelection();
        delete target.setTaggingData;
        // }

        if (typeof tagging_sign !== "undefined") {
            target.tagging_sign.destroy();
            delete target.tagging_sign;
        }

        return true;
    }

    // The code below will activate only when is_tagging TRUE

    if (typeof tagging_sign === "undefined") {
        target.tagging_sign = target.renderer.label("Tagging", 30, 20)
        .attr({
            fill: Highcharts.getOptions().colors[5],
            padding: 10,
            r: 5,
            zIndex: 8
        })
        .css({
            color: "#FFFFFF"
        })
        .add();
    }

    let selected_points = target.getSelectedPoints();
    const selected_ts_list = selected_points.map(x =>x.x);
    const min_sel_ts = Math.min(...selected_ts_list);
    const max_sel_ts = Math.max(...selected_ts_list);
    // Select points
    if (typeof e.xAxis !== "undefined") {
        series.forEach(s => {
            s.points.forEach(point => {
                if ((point.x >= e.xAxis[0].min || point.x >= min_sel_ts)
                && (point.x <= e.xAxis[0].max || point.x <= max_sel_ts)
                && point.y !== null) {
                    point.select(true, true);
                }
            });
        });

        selected_points = target.getSelectedPoints();
        if (selected_points.length > 0) {
            target.reset_selection.add();
            target.submit_selection.add();
        }
    }

    // Fire a custom event
    Highcharts.fireEvent(target, "selectedpoints", { selected_points, rain_gauge, rain_id });
    return false; // Don't zoom
}

function processSelectedPoints (e) {
    const {
        selected_points, rain_gauge, rain_id,
        is_submit, setTaggingData, target: chart
    } = e;

    const tagged_data = [];
    selected_points.forEach((data) => {
        let timestamp = new Date(data.x);
        timestamp = moment(timestamp).format("YYYY-MM-DD HH:mm:ss");
        if (tagged_data.includes(timestamp) !== true) {
            tagged_data.push(timestamp);
        }
    });

    const submitted_data = {
        rain_gauge,
        ts_start: tagged_data[0],
        ts_end: tagged_data[tagged_data.length - 1],
        rain_id,
        chart
    };

    if (is_submit) {
        setTaggingData(submitted_data);
    }
}

function unselectPoints (series) {
    series.forEach(s => {
        s.points.forEach(point => {
            point.select(false, false);
        });
    });
}

// eslint-disable-next-line max-params
function prepareInstantaneousRainfallChartOption (row, input, is_tagging_data, setIsTaggingData, setTaggingData) {
    const { set, max_rval_data, null_processed } = row;
    const {
        distance, max_rval, gauge_name, rain_id
    } = set;
    const { ts_start, ts_end, site_code } = input;

    return {
        series: max_rval_data,
        chart: {
            type: "column",
            zoomType: "x",
            panning: true,
            events: {
                selection: selectPointsByDrag,
                selectedpoints: processSelectedPoints
                // click: unselectByClick
            },
            height: 400,
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
            crosshairs: true,
            formatter (tooltip) {
                const { x, y, is_invalid, tagger, remarks, observed_data } = this.points[0].point;
                let str = `${moment.unix(x / 1000).format("dddd, MMMM D, HH:mm")}<br/>` + 
                `- Rain: <b>${y}</b>`;

                if (is_invalid) {
                    const { first_name, last_name } = tagger;
                    str += `<br/>- Observed Data: <b>${observed_data_dict[observed_data]}</b><br/>` +
                    `- Tagger: <b>${first_name} ${last_name}</b><br/>` +
                    `- Remarks: <b>${remarks || "---"}</b>`;
                }

                return str;
            }
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 3
                },
                cursor: "pointer"
            }
        },
        exporting: {
            menuItemDefinitions: {
                // Custom definition
                tagInvalidData: {
                    onclick () {
                        Highcharts.fireEvent(this, "selection", {
                            is_tagging_data: !is_tagging_data, rain_gauge: gauge_name,
                            rain_id, setTaggingData
                        });
                        setIsTaggingData(!is_tagging_data);
                    },
                    text: is_tagging_data ? "Exit tagging" : "Tag invalid data"
                }
            },
            buttons: {
                contextButton: {
                    menuItems: ["tagInvalidData", "viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"]
                }
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
            height: 400,
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
        input: conso_input, disableBack, currentUser,
        saveSVG
    } = props;
    
    const arr_num = typeof rain_gauge !== "undefined" ? 1 : 4;

    const [rainfall_data, setRainfallData] = useState([]);
    const [processed_data, setProcessedData] = useState([]);
    const default_range_info = { label: "3 days", unit: "days", duration: 3 };
    const [selected_range_info, setSelectedRangeInfo] = useState(default_range_info);
    const [to_reload, setToReload] = useState(false);

    const chartRefs = useRef([...Array(arr_num)].map(() => ({
        instantaneous: createRef(),
        cumulative: createRef()
    })));
    const [get_svg, setGetSVGNow] = useState(false);
    const [svg_list, setSVGList] = useState([]);

    const disable_back = typeof disableBack === "undefined" ? false : disableBack;
    const save_svg = typeof saveSVG === "undefined" ? false : saveSVG;

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

    const { unit, duration } = selected_range_info;
    const ts_start = computeForStartTs(dt_ts_end, duration, unit);
    const days_diff = dt_ts_end.diff(moment(ts_start, "YYYY-MM-DD HH:mm:ss"), "days");
    const input = { days_diff, ts_start, ts_end, site_code: sc };

    const [is_tagging_data, setIsTaggingData] = useState(false);
    const [tagging_data, setTaggingData] = useState(null);
    const [is_tag_modal_open, setIsTagModalOpen] = useState(false);

    const default_options = {
        cumulative: prepareCumulativeRainfallChartOption(default_data, input),
        instantaneous: prepareInstantaneousRainfallChartOption(default_data, input, is_tagging_data, setIsTaggingData, setTaggingData)
    };

    const getDataFn = () => {
        setProcessedData([]);
        getRainfallPlotData(input, data => {
            let arr = data;
            if (typeof rain_gauge !== "undefined") {
                arr = data.filter(row => row.gauge_name === `rain_${rain_gauge}`);
            }
            setRainfallData(arr);
        });
    };

    useEffect(() => {
        getDataFn();
    }, [selected_range_info]);

    useEffect(() => {
        if (to_reload) {
            getDataFn();
            setToReload(false);
        }
    }, [to_reload]);

    useEffect(() => {
        const temp = [];
        rainfall_data.forEach(set => {
            const data = prepareRainfallData(set);
            temp.push(data);
        });
        
        if (temp.length > 0) setProcessedData(temp);
    }, [rainfall_data]);

    const [options, setOptions] = useState([]);

    useEffect(() => {
        const temp = [];
        processed_data.forEach(data => {
            const instantaneous = prepareInstantaneousRainfallChartOption(data, input, is_tagging_data, setIsTaggingData, setTaggingData);
            const cumulative = prepareCumulativeRainfallChartOption(data, input);
            temp.push({ instantaneous, cumulative });
        });
        setOptions(temp);
        if (temp.length > 0 && save_svg) setGetSVGNow(true);
    }, [processed_data, is_tagging_data]);

    useEffect(() => {
        if (is_tagging_data) setIsTagModalOpen(true);
    }, [tagging_data]);

    useEffect(() => {
        if (get_svg) {
            const temp = [];
            chartRefs.current.forEach(a => {
                const { instantaneous, cumulative } = a;
                const { current: { chart: chart_i } } = instantaneous;
                const { current: { chart: chart_c } } = cumulative;
                const c = chart_c.getSVGForExport();
                const i = chart_i.getSVGForExport();

                temp.push({ c, i });
            });
            setSVGList(temp);
        }
    }, [get_svg]);

    const svgRef = useRef(null);
    useEffect(() => {
        if (svg_list.length > 0) {
            const svg = svgRef.current.outerHTML;
            const temp = {
                user_id: currentUser.user_id,
                site_code,
                chart_type: "rainfall",
                svg
            };

            saveChartSVG(temp, data => {});
        }
    }, [svg_list]);

    const onTagSuccess = () => {
        Highcharts.fireEvent(tagging_data.chart, "selection", {
            is_tagging_data: false
        });
        setIsTaggingData(false);
        setToReload(true);
    };
    
    return (
        <Fragment>
            <Grid container spacing={1} justify="space-between" alignItems="center">
                {
                    !disable_back && <div>
                        <BackToMainButton 
                            {...props}
                        />
                    </div>
                }
                
                <Grid container item xs justify="flex-end">
                    <DateRangeSelector
                        selectedRangeInfo={selected_range_info}
                        setSelectedRangeInfo={setSelectedRangeInfo}
                        disableAll
                    />
                </Grid>
            </Grid>
 
            <div style={{ marginTop: 16 }}>
                <Grid container spacing={4}>
                    {
                        chartRefs.current.map((ref, i) => {
                            let opt = { ...default_options };
                            if (options.length > 0) {
                                opt = options[i];
                            }

                            return (
                                <Fragment key={i}>
                                    <Grid item xs={12} md={6}>
                                        <Paper>
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={opt.instantaneous}
                                                ref={ref.instantaneous}
                                            />
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Paper>
                                            <HighchartsReact
                                                highcharts={Highcharts}
                                                options={opt.cumulative}
                                                ref={ref.cumulative}
                                            />
                                        </Paper>
                                    </Grid>
                                    
                                </Fragment>
                            );
                        })
                    }
                </Grid>
            </div>

            <RainfallDataTaggingModal
                isOpen={is_tag_modal_open}
                closeModalFn={() => setIsTagModalOpen(false)}
                taggingData={tagging_data}
                onTagSuccess={onTagSuccess}
            />

            {
                save_svg && (
                    <Hidden xsUp implementation="css">
                        <svg 
                            width={1200} height={1600}
                            viewBox="0 0 1200 1600"
                            ref={svgRef}
                        >
                            {
                                svg_list.map((x, index) => {
                                    const { i, c } = x;
                                    return (
                                        <Fragment key={index}>
                                            { /* eslint-disable-next-line react/no-danger */ }
                                            <svg x={0} y={400 * index} dangerouslySetInnerHTML={{ __html: i }} />
                                            { /* eslint-disable-next-line react/no-danger */ }
                                            <svg x={600} y={400 * index} dangerouslySetInnerHTML={{ __html: c }} />
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
        charts.forEach(chart => {
            if (chart !== this_chart && typeof chart !== "undefined") {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: "syncExtremes" });
                }
            }
        });
    }
}
