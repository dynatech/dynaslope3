import React, { useState, useEffect, Fragment } from "react";
import { Route, Link } from "react-router-dom";

import Highcharts from "highcharts";
import HC_exporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import { useSnackbar } from "notistack";

import { 
    Button, ButtonGroup,
    Paper, withMobileDialog, Dialog,
    DialogTitle, DialogContent,
    DialogContentText, DialogActions, Grid,
    Typography, Divider, TextField, FormControl,
    FormControlLabel, Radio, RadioGroup
} from "@material-ui/core";
import { ArrowDropDown } from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import SurficialTrendingGraphs from "./SurficialTrendingGraphs";
import BackToMainButton from "./BackToMainButton";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

import { getSurficialPlotData, deleteSurficialData, updateSurficialData, saveChartSVG } from "../ajax";
import { computeForStartTs } from "../../../UtilityFunctions";

// init the module
HC_exporting(Highcharts);

const hideTrending = history => e => {
    e.preventDefault();
    history.goBack();
};

function UpdateDeleteModal (props) {
    const { 
        editModal, fullScreen, setEditModal, 
        siteCode, setRedrawChart, chosenPoint
    } = props;
    const {
        is_open, ts, name, measurement, mo_id, data_id
    } = editModal;
    const { ts: chosen_ts, measurement: chosen_meas } = chosenPoint;
    
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [is_delete_clicked, setDeleteClick] = useState(false);
    const [delete_quantity, setDeleteQuantity] = useState("one");
    const changeRadioValueFn = x => setDeleteQuantity(x.target.value);

    useEffect(() => { setDeleteClick(false); }, [is_open]);

    const changeHandlerFn = (prop, value) => x => {
        let fin_val = value;
        if (prop === "ts") fin_val = x;
        else if (prop === "measurement") fin_val = x.target.value;

        setEditModal({
            ...editModal, [prop]: fin_val 
        });
    };

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const deleteDataFn = () => {
        const { data_id, mo_id } = editModal;
        let id = data_id;
        if (delete_quantity === "all") {
            id = mo_id;
        }

        const input = {
            quantity: delete_quantity,
            id
        };

        setEditModal({
            ...editModal, is_open: false 
        });

        deleteSurficialData(input, data => {
            const { status } = data;

            if (status === "success") {
                enqueueSnackbar(
                    "Surficial data delete successful!",
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
                setRedrawChart(true);
            } else {
                enqueueSnackbar(
                    "Error deleting surficial data...",
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        });
    };

    const updateDataFn = () => {
        let input = {};
        
        if (chosen_ts !== ts) {
            input = {
                ...input, mo_id, ts: moment(ts).format("YYYY-MM-DD HH:mm:ss")
            };
        }

        if (chosen_meas !== measurement) {
            input = {
                ...input, data_id, measurement
            };
        }

        setEditModal({
            ...editModal, is_open: false 
        });

        if (Object.keys(input).length !== 0) {
            updateSurficialData(input, data => {
                const { status } = data;

                if (status === "success") {
                    enqueueSnackbar(
                        "Surficial data update successful!",
                        {
                            variant: "success",
                            autoHideDuration: 7000,
                            action: snackBarActionFn
                        }
                    );
                    setRedrawChart(true);
                } else {
                    enqueueSnackbar(
                        "Error updating surficial data...",
                        {
                            variant: "error",
                            autoHideDuration: 7000,
                            action: snackBarActionFn
                        }
                    );
                }
            });
        }
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={is_open}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Update surficial data
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Carefully edit the necessary fields or delete entries if needed. 
                </DialogContentText>

                <Grid container spacing={2}>
                    <Grid item xs={12} style={{ textAlign: "center" }}>
                        <Typography variant="subtitle1" style={{ fontWeight: "bold" }}>
                            {siteCode.toUpperCase()} - Marker {name}
                        </Typography>
                        <Typography variant="body2">
                            Timestamp: {moment(chosen_ts).format("DD MMMM YYYY, HH:mm:ss")}
                        </Typography>
                        <Typography variant="body2">
                            Measurement: {chosen_meas} cm
                        </Typography>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
                            EDIT
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField 
                            label="Change marker data measurement"
                            value={measurement}
                            onChange={changeHandlerFn("measurement")}
                            type="number"
                            fullWidth
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        Change observation timestamp (applies to the rest of the points)
                    </Grid>

                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12}>
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Observation Timestamp"
                                value={moment(ts)}
                                onChange={changeHandlerFn("ts")}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="__/__/____ __:__"
                                clearable
                                disableFuture
                                fullWidth
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>

                    <Grid item xs={12} style={{ textAlign: "right" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={updateDataFn}
                        >
                            Update Data
                        </Button>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
                            DELETE
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        Be careful on deleting marker data. Delete only IF REALLY NEEDED.
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl component="fieldset" >
                            <RadioGroup
                                aria-label="gender"
                                name="gender1"
                                value={delete_quantity}
                                onChange={changeRadioValueFn}
                            >
                                <FormControlLabel value="one" control={<Radio />} label="Delete measurement of this marker only" />
                                <FormControlLabel value="all" control={<Radio />} label="Delete all measurements from given marker observation" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} style={{ textAlign: "right" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setDeleteClick(true)}
                        >
                            Delete Data
                        </Button>
                    </Grid>

                    {
                        is_delete_clicked && (
                            <Grid item xs={12} style={{ textAlign: "right" }}>
                                <ButtonGroup 
                                    variant="contained" 
                                    size="small"
                                    color="secondary"
                                    aria-label="small contained button group"
                                >
                                    <Button disabled>Are you sure?</Button>
                                    <Button onClick={deleteDataFn}>Yes</Button>
                                    <Button onClick={() => setDeleteClick(false)}>No</Button>
                                </ButtonGroup>
                            </Grid>
                        )
                    }
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={changeHandlerFn("is_open", false)}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// eslint-disable-next-line max-params
function prepareOptions (input, data, width, setEditModal, setChosenPointCopy, is_end_of_shift) {
    const subtext = "";
    const { site_code, timestamps } = input;
    const { start, end } = timestamps;
    const start_date = moment(start, "YYYY-MM-DD HH:mm:ss");
    const end_date = moment(end, "YYYY-MM-DD HH:mm:ss");

    const font_size = isWidthDown(width, "sm") ? "1rem" : "0.90rem";

    let min_x = start_date;
    if (is_end_of_shift && data.length > 0) {
        const { data: meas_row } = data[0];
        if (meas_row.length > 0) min_x = moment(meas_row[0].x);
            
    }

    return {
        title: {
            text: `<b>Surficial Data History Chart of ${site_code.toUpperCase()}</b>`,
            style: { fontSize: font_size },
            margin: 36,
            y: 18
        },
        time: { timezoneOffset: -8 * 60 },
        series: data,
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
            spacingTop: 24,
            spacingRight: 24
        },
        subtitle: {
            text: `${subtext}As of: <b>${moment(end_date).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "0.75rem" }
        },
        legend: {
            labelFormatter () {
                const { userOptions: { marker_name: mn, in_use } } = this;
                const name = in_use === 0 ? `${mn} (Defunct)` : mn;
                return name;
            }
        },
        yAxis: {
            title: {
                text: "<b>Displacement (cm)</b>"
            }
        },
        xAxis: {
            min: Date.parse(min_x),
            max: Date.parse(end_date),
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e. %b %Y",
                year: "%b"
            },
            title: {
                text: "<b>Date</b>"
            },
        },
        tooltip: {
            shared: true,
            crosshairs: true
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true
                },
                dashStyle: "ShortDash"
            },
            series: {
                marker: {
                    radius: 3
                },
                cursor: "pointer",
                point: {
                    events: {
                        click () {
                            const {
                                data_id, x, y,
                                mo_id,
                                series: { name } 
                            } = this;

                            const obj = {
                                data_id,
                                name,
                                mo_id, 
                                ts: moment(x),
                                measurement: y,
                            };

                            setChosenPointCopy(obj);

                            setEditModal({
                                ...obj,
                                is_open: true
                            });
                        }
                    }
                }
            }
        },
        loading: {
            showDuration: 100,
            hideDuration: 1000
        },
        credits: {
            enabled: false
        }
    };
}

function createSurficialGraph (options, chartRef) {
    const temp = <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
    />;

    return temp;
}

function SurficialGraph (props) {
    const { 
        width, match: { url, params: { site_code } },
        fullScreen, disableBack, disableMarkerList,
        saveSVG, input, currentUser,
        isEndOfShift
    } = props;

    const [ selected, setSelected ] = useState("3 months");
    const default_range_info = { label: "3 months", unit: "months", duration: 3 };
    const [ selected_range_info, setSelectedRangeInfo ] = useState(default_range_info);
    let { unit, duration } = selected_range_info;
    let ts_end = "";
    let dt_ts_end;
    if (typeof input !== "undefined") {
        const { ts_end: te, range_info } = input;
        const { unit: conso_unit, duration: conso_duration } = range_info;
        unit = conso_unit;
        duration = conso_duration;
        ts_end = te;
        dt_ts_end = moment(te);
    } else {
        const ts_now = moment();
        ts_end = ts_now.format("YYYY-MM-DD HH:mm:ss");
        dt_ts_end = ts_now;
    }

    const disable_back = typeof disableBack === "undefined" ? false : disableBack;
    const disable_marker_list = typeof disableMarkerList === "undefined" ? false : disableMarkerList;
    const save_svg = typeof saveSVG === "undefined" ? false : saveSVG;
    const is_end_of_shift = typeof isEndOfShift === "undefined" ? false : isEndOfShift;

    const ts_start = computeForStartTs(dt_ts_end, duration, unit);
    const chartRef = React.useRef(null);
    const timestamps = { start: ts_start, end: ts_end };
    const [save_svg_now, setSaveSVGNow] = useState(false);
    const [to_redraw_chart, setRedrawChart] = useState(true);
    const [surficial_data, setSurficialData] = useState([]);
    const [trending_data, setTrendingData] = useState([]);

    const [chosen_point, setChosenPointCopy] = useState({
        data_id: null,
        mo_id: null,
        name: null,
        ts: null,
        measurement: 0,
    });

    const [edit_modal, setEditModal] = useState({
        data_id: null,
        mo_id: null,
        name: null,
        ts: null,
        measurement: 0,
        is_open: false
    });

    // useEffect(() => {
    //     if (typeof input !== "undefined") {
    //         console.log("input", input);
    //         const { ts_end: te } = input;
    //         setTimestamps({ end: te, start: computeForStartTs(moment(te)) });
    //         // setRedrawChart(true);
    //     }
    // }, [input]);

    useEffect(() => {
        const { current } = chartRef;
        if (current !== null || to_redraw_chart)
            current.chart.showLoading();

        if (to_redraw_chart) {
            const f_input = { site_code, ...timestamps };
            getSurficialPlotData(f_input, data => {
                setSurficialData(data);

                if (current !== null) {
                    const { chart } = current;
                    chart.hideLoading();

                    if (save_svg) setSaveSVGNow(true);
                    
                    const legend = chart.legend.group;
                    const items = chart.legend.allItems;
                    const item = items[items.length - 1];

                    const fn = is_visible => {
                        chart.series.forEach(s => {
                            s.setVisible(is_visible, false);
                        });
                        chart.redraw();
                    };

                    const { height, width } = chart.legend.contentGroup.getBBox();
                    const x = legend.translateX + item.legendGroup.translateX + width - 40;
                    const y = legend.translateY + height - 20;
                    chart.renderer.button("Show All", x, y, () => fn(true))
                    .add();
                    chart.renderer.button("Hide All", x + 75, y, () => fn(false))
                    .add();
                }
            }, is_end_of_shift);

            setRedrawChart(true);
        }
    }, [to_redraw_chart, selected_range_info, duration]);

    useEffect(() => {
        const { current: { chart } } = chartRef;
        const svg = chart.getSVGForExport();
        if (save_svg_now) {
            const temp = {
                user_id: currentUser.user_id,
                site_code,
                chart_type: "surficial",
                svg
            };

            saveChartSVG(temp, data => {});
        }
    }, [save_svg_now]);

    const input_obj = { site_code, timestamps };
    const options = prepareOptions(input_obj, surficial_data, width, setEditModal, setChosenPointCopy, is_end_of_shift);
    const graph_component = createSurficialGraph(options, chartRef);

    return (
        <Fragment>
            <div style={{ display: "flex", justifyContent: "space-between" }}>                
                { !disable_back && <BackToMainButton 
                    {...props}
                    selected={selected}
                    setSelected={setSelected}
                    setSelectedRangeInfo={setSelectedRangeInfo}
                /> }

                { surficial_data.length > 0 && !disable_marker_list && (
                    <ButtonGroup
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="Site markers button group"
                    >
                        <Button disabled style={{ color: "#000000" }}>Marker</Button>

                        {
                            isWidthDown(width, "sm") ? (surficial_data.map(marker => {
                                const { marker_name, marker_id } = marker;
                                return (
                                    <Button 
                                        component={Link}
                                        to={`${url}/${marker_name}`}
                                        key={marker_id}
                                    >
                                        {marker_name}
                                    </Button> 
                                );
                            })) : (<Button
                                color="primary"
                                variant="contained"
                                size="small"
                                // aria-owns={open ? "menu-list-grow" : undefined}
                                // aria-haspopup="true"
                                // onClick={handleToggle}
                            >
                                <ArrowDropDown />
                            </Button>)
                        }
                    </ButtonGroup> 
                )}
            </div>

            <Paper style={{ marginTop: 24 }}>
                {graph_component}
            </Paper>

            <UpdateDeleteModal 
                chosenPoint={chosen_point}
                editModal={edit_modal}
                setEditModal={setEditModal}
                fullScreen={fullScreen}
                siteCode={site_code}
                setRedrawChart={setRedrawChart}
            />

            <Route path={`${url}/:marker_name`} render={
                props => {
                    return "print here";
                }
            } />
        </Fragment>
    );
}

{ /* <SurficialTrendingGraphs 
                    {...props}
                    timestamps={timestamps}
                    siteCode={site_code}
                    hideTrending={hideTrending}
                    trendingData={trending_data}
                    setTrendingData={setTrendingData}
                /> */ }

export default withMobileDialog()(SurficialGraph);
