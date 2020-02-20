import React, { 
    Fragment, useState, 
    useEffect, useContext
} from "react";
import { createPortal } from "react-dom";

import {
    makeStyles, Button, Grid,
    Paper
} from "@material-ui/core";
import { InsertChart, Event } from "@material-ui/icons";
import withWidth, { isWidthDown } from "@material-ui/core/withWidth";
import { Route, Switch, Link } from "react-router-dom";

import Highcharts from "highcharts/highcharts.src";
import heatmap from "highcharts/modules/heatmap.src";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import ContentLoader from "react-content-loader";

import SurficialGraph from "./SurficialGraph";
import RainfallGraph from "./RainfallGraph";
import SubsurfaceGraph from "./SubsurfaceGraph";
import ConsolidatedSiteCharts from "./ConsolidatedSiteCharts";
import ConsolidateSiteChartsModal from "./ConsolidateSiteChartsModal";
import InsertEarthquakeModal from "./InsertEarthquakeModal";
import EarthquakeContainer from "./EarthquakeContainer";
import MomsInstancesPage from "./MomsInstancesPage";

import { 
    getMOMsAlertSummary, getEarthquakeEvents, getEarthquakeAlerts,
    getDataPresenceData
} from "../ajax";
import { 
    subscribeToWebSocket, unsubscribeToWebSocket,
    receiveAllSiteRainfallData
} from "../../../websocket/monitoring_ws";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";

heatmap(Highcharts);

let ts_now;
const format_str = "D MMM YYYY, HH:mm";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 30
        }
    }; 
});

const MyLoader = () => (
    <ContentLoader 
        height={600}
        width={400}
        speed={1}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
    >
        <rect x="0" y="0" rx="0" ry="0" width="400" height="600" />
    </ContentLoader>
);

function CustomButtons (change_consolidate_modal_fn, open_eq_modal) {
    return <span>
        <Button
            aria-label="Insert Earthquake Event"
            variant="contained" 
            color="primary"
            size="small" 
            style={{ marginRight: 8 }}
            onClick={open_eq_modal(true)}
        >
            <Event style={{ paddingRight: 4, fontSize: 20 }}/>
                    Insert Earthquake Event
        </Button>
        <Button
            aria-label="Consolidate by site"
            variant="contained" 
            color="primary"
            size="small" 
            style={{ marginRight: 8 }}
            onClick={change_consolidate_modal_fn(true)}
        >
            <InsertChart style={{ paddingRight: 4, fontSize: 20 }}/>
                    Consolidate by site
        </Button>
    </span>;
}

function createCustomLabels (chart, url) {
    const custom_labels = [];
    if (chart && Object.keys(chart).length !== 0 && chart.xAxis[0]) {
        chart.series[0].points.forEach(p => {
            custom_labels.push(LabelComponent(url, p));
        });
    }
    return custom_labels;
}

function LabelComponent (url, p) {
    const { data, type, dataLabel } = p;

    return (
        <div key={data}>
            {createPortal(
                <Link 
                    to={`${url}/${type}/${data}`}
                    style={{ 
                        // textDecoration: "none",
                        fontSize: dataLabel.options.style.fontSize, 
                        // fontWeight: 800,
                        position: "absolute",
                        fontFamily: "Lucida Grande, Lucida Sans Unicode, Arial Helvetica, sans-serif",
                        color: "#000000"
                    }}
                >
                    {data.toUpperCase()}
                </Link>, dataLabel.div
            )}
        </div>
    );
}

function generateData (data_list, type, is_mobile) {
    const data = [];
    let x = 0;

    data_list.forEach((row, i) => {
        const { last_data, ts_updated, diff_days } = row;

        let label;
        const value = row.presence;
        if (type === "surficial") {
            label = row.site_code;
            if (!row.has_surficial_markers) label += "*";
        } else if (type === "rainfall") {
            label = row.rain_gauge.gauge_name;
        } else if (type === "subsurface") {
            label = row.tsm_sensor.logger.logger_name;
        } else {
            label = row.logger.logger_name;
        }

        // const y = is_mobile ? i % 5 : i % 10;
        const y = i % 5;
        const a = {
            // x: y, // x : y,
            // y: 5 - x, // 10 - y : 5 - x,
            x: y,
            y: 5 - x,
            value,
            label: label.toUpperCase(),
            data: label,
            type,
            ts_last_data: last_data,
            ts_updated,
            diff_days
        };
        data.push(a);
        
        // const cond = is_mobile ? i % 5 === 4 : i % 10 === 9;
        const cond = i % 5 === 4;
        if (cond) x += 1;
    });

    return data;
}

function prepareOptions (is_mobile, type, data_list) {
    const uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    const title = `<b>${uc_type} Data Availability</b>`;

    let height = 50;
    let additional_height = 60;
    let subtitle_text = `Timestamp: <b>${ts_now.format(format_str)}</b>`;
    switch (type) {
        case "surficial":
            subtitle_text += "<br/>Note: Data presence within four hours until next release" +
            "<br/><b>*Sites without markers</b>";
            break;
        case "subsurface":
            height = 85;
            additional_height = 100;
            break;
        case "loggers":
            height = 95;
            additional_height = 100;
            // fallthrough
        default:
            break;
    }

    if (is_mobile)
        height += additional_height;

    const data = generateData(data_list, type, is_mobile);

    const options = {
        chart: {
            type: "heatmap",
            // height: `${height }%`,
            height: 600,
            spacingTop: 12,
            spacingRight: 18
        },
        title: {
            text: title,
            style: { fontSize: "1rem" },
            y: 20
        },
        subtitle: {
            text: subtitle_text,
            style: { fontSize: "0.70rem" }
        },
        xAxis: {
            visible: false
        },
        yAxis: {
            visible: false
        },
        legend: {
            enabled: false
        },
        colorAxis: {
            stops: [
                [0, "#cccccc"],
                [1, "#7cb5ec"]
            ],
            min: 0,
            max: 1
        },
        tooltip: {
            outside: true,
            formatter () {
                const {
                    label, type, value,
                    ts_last_data, ts_updated, diff_days
                } = this.point;
                const presence = value ? "With" : "No";
                
                let type_label;
                switch (type) {
                    case "rainfall":
                        type_label = "Rain gauge";
                        break;
                    case "surficial":
                        type_label = "Site";
                        break;
                    case "subsurface":
                        type_label = "Sensor";
                        break;
                    case "loggers":
                        type_label = "Logger";
                        // fallthrough
                    default:
                        break;
                }

                let str = `${type_label}: <b>${label}</b><br/>` + 
                `Presence: <b>${presence} data</b><br/>` + 
                `Last data timestamp: <b>${moment(ts_last_data).format(format_str)}</b>`;

                if (type !== "surficial") {
                    str += `<br/>Last update timestamp: <b>${moment(ts_updated).format(format_str)}</b><br/>` +
                    `Days since last data: <b>${diff_days}</b><br/>`;
                }

                return str;
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: "",
            borderWidth: 1,
            borderColor: "#444444",
            data,
            dataLabels: {
                enabled: true,
                useHTML: true,
                color: "#000000",
                display: "none",
                style: {
                    fontWeight: 100,
                    // fontSize: "0.75rem"
                },
                formatter () {
                    const { label } = this.point;
                    return label;
                }
            }
        }]
    };

    return options;
}

function formatRainfallSummaryData (data) {
    const list_1d = [];
    const list_3d = [];
    const site_codes = [];

    data.forEach(record => {
        const {
            site_code,
            "1D cml": cumulative_1d,
            "3D cml": cumulative_3d,
            "half of 2yr max": threshold_1d,
            "2yr max": threshold_3d,
            DataSource: data_source
        } = record;

        const temp_1d = cumulative_1d ? `${cumulative_1d} mm` : "0 mm";
        const temp_3d = cumulative_3d ? `${cumulative_3d} mm` : "0 mm";

        const cum_1d = {
            y: (cumulative_1d / threshold_1d) * 100,
            data_value: `<b><i>One Day Data</i></b><br>- Cumulative Data: <b>${temp_1d}</b><br>- Threshold: <b>${threshold_1d} mm</b>`,
            data_source
        };

        const cum_3d = {
            y: (cumulative_3d / threshold_3d) * 100,
            data_value: `<b><i>Three Day Data</i></b><br>- Cumulative Data: <b>${temp_3d}</b><br>- Threshold: <b>${threshold_3d} mm</b>`,
            data_source
        };

        list_1d.push(cum_1d);
        list_3d.push(cum_3d);
        site_codes.push(site_code.toUpperCase());
    });

    return {
        list_1d, list_3d, site_codes
    };
}

function prepareRainfallSummaryOption (rainfall_summary) {
    const { site_codes, list_1d, list_3d } = rainfall_summary;
    
    return {
        chart: {
            type: "column"
        },
        title: {
            text: "<b>Cumulative Rainfall Data vs Threshold Plot of Dynaslope Sites</b>",
            style: { fontSize: "1rem" },
            y: 20
        },
        subtitle: {
            text: `As of: <b>${moment().format("D MMM YYYY, HH:mm")}</b><br>Note: Percentage capped at 100%`,
        },
        xAxis: {
            categories: site_codes,
            title: {
                text: "<b>Sites</b>"
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: "<b>Threshold Ratio (%)</b>"
            }
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter () {
                const { x, points } = this;
                const { data_source } = points[0].point;
                const source = data_source.replace(/_/g, " ");

                let str = `<b>${x} (${source.toUpperCase()})</b><br>`;
                points.forEach(point => {
                    str += `${point.point.data_value}<br>`;
                    str += `- Percentage: <b>${point.point.y.toFixed(2)}%</b><br>`;
                });

                return str;
            }
        },
        plotOptions: {
            column: {
                grouping: false,
                shadow: false
            }
        },
        series: [{
            name: "Three-day Cumulative Data",
            data: list_3d,
            pointPadding: 0, 
            color: "#FF0000"
        }, {
            name: "One-day Cumulative Data",
            data: list_1d,
            pointPadding: 0.2

        }],
        credits: {
            enabled: false
        },
    };
}

function Container (props) {
    const {
        width, location,
        match: { path, url }
    } = props;
    const classes = useStyles();
    const is_desktop = isWidthDown(width, "sm");

    ts_now = moment();

    const [is_consolidate_modal_open, setIsConsolidateModalOpen] = useState(false);
    const [is_earthquake_modal, setisEarthquakeModalOpen] = useState(false);
    const change_consolidate_modal_fn = bool => () => setIsConsolidateModalOpen(bool);
    const open_eq_modal = bool => () => setisEarthquakeModalOpen(bool);

    const [subsurface_data_presence, setSubsurfaceDataPresence] = useState([]);
    const [subsurface_dp_option, setSubsurfaceDpOption] = useState(null);
    const [subsurface_custom_label, setSubsurfaceCustomLabel] = useState(null);

    const [surficial_data_presence, setSurficialDataPresence] = useState([]);
    const [surficial_dp_option, setSurficialDpOption] = useState(null);
    const [surficial_custom_label, setSurficialCustomLabel] = useState(null);

    const [rainfall_data_presence, setRainfallDataPresence] = useState([]);
    const [rainfall_dp_option, setRainfallDpOption] = useState(null);
    const [rainfall_custom_label, setRainfallCustomLabel] = useState(null);

    const [loggers_data_presence, setLoggersDataPresence] = useState([]);
    const [loggers_dp_option, setLoggersDpOption] = useState(null);
    
    const [chart_instances, setChartInstances] = useState({});

    const [rainfall_summary_option, setRainfallSummaryOption] = useState(null);

    const save_chart_instances_fn = name => chart => {
        setChartInstances(prev => ({ ...prev, [name]: chart }));
    };

    useEffect(() => {
        getDataPresenceData("surficial", data => {
            setSurficialDataPresence(data);
        });

        getDataPresenceData("tsm", data => {
            setSubsurfaceDataPresence(data);
        });

        getDataPresenceData("rain_gauges", data => {
            setRainfallDataPresence(data);
        });

        getDataPresenceData("loggers", data => {
            setLoggersDataPresence(data);
        });
    }, []);

    useEffect(() => {
        if (surficial_data_presence.length > 0) {
            const option = prepareOptions(!is_desktop, "surficial", surficial_data_presence);
            setSurficialDpOption(option);
        }
    }, [surficial_data_presence, is_desktop]);

    useEffect(() => {
        if (subsurface_data_presence.length > 0) {
            const option = prepareOptions(!is_desktop, "subsurface", subsurface_data_presence);
            setSubsurfaceDpOption(option);
        }
    }, [subsurface_data_presence, is_desktop]);

    useEffect(() => {
        if (rainfall_data_presence.length > 0) {
            const option = prepareOptions(!is_desktop, "rainfall", rainfall_data_presence);
            setRainfallDpOption(option);
        }
    }, [rainfall_data_presence, is_desktop]);

    useEffect(() => {
        if (loggers_data_presence.length > 0) {
            const option = prepareOptions(!is_desktop, "loggers", loggers_data_presence);
            setLoggersDpOption(option);
        }
    }, [loggers_data_presence, is_desktop]);

    useEffect(() => {
        const temp = createCustomLabels(chart_instances.rainfall, url);
        setRainfallCustomLabel(temp);
    }, [chart_instances.rainfall, url]);

    useEffect(() => {
        const temp = createCustomLabels(chart_instances.surficial, url);
        setSurficialCustomLabel(temp);
    }, [chart_instances.surficial, url]);

    useEffect(() => {
        const temp = createCustomLabels(chart_instances.subsurface, url);
        setSubsurfaceCustomLabel(temp);
    }, [chart_instances.subsurface, url]);

    const { setIsReconnecting } = useContext(GeneralContext);
    
    useEffect(() => {
        subscribeToWebSocket(setIsReconnecting);

        receiveAllSiteRainfallData(data => {
            const obj = formatRainfallSummaryData(data);
            const temp = prepareRainfallSummaryOption(obj);
            setRainfallSummaryOption(temp);
        });

        return function cleanup () {
            unsubscribeToWebSocket();
        };
    }, []);

    const [moms_alerts, setMOMsAlerts] = useState([]);
    useEffect(() => {
        const table_data = [];
        getMOMsAlertSummary((data) => {
            data.forEach(site => {
                const { site_code, moms_alert } = site;
                const address = prepareSiteAddress(site, true, "start");
                const arr = { site_code, address, moms_alert };
                table_data.push(arr);
            });

            setMOMsAlerts(table_data);
        });  
    }, [url]);

    const moms_table_options = [
        {
            name: "address",
            label: "Site",
            options: {
                filter: false,
                customBodyRender: (value, { rowIndex }) => {
                    const { site_code } = moms_alerts[rowIndex];
                    return <Link to={`${url}/moms/${site_code}`} style={{ color: "black" }}>
                        {value}
                    </Link>;
                }
            }
        },
        {
            name: "moms_alert",
            label: "Alert"
        }
    ];

    const [eq_events, setEqEvents] = useState([]);
    const [reload_eq_event, setReloadEqEvent] = useState(true);
    useEffect(() => {
        if (reload_eq_event) {
            getEarthquakeEvents(data => {
                setEqEvents(data);
            });
            setReloadEqEvent(false);
        }
        // console.log("eq reloaded");
    }, [reload_eq_event]);
    const [eq_alerts, setEqAlerts] = React.useState([]);
    const [eq_al_tbl_pagination, setEqAlTblPage] = React.useState({ limit: 5, offset: 0, count: 0 });
    const [is_first_pass, setFirstPass] = React.useState(true);
    React.useEffect(() => {
        getEarthquakeAlerts(eq_al_tbl_pagination, data => {
            const { count, data: eq_data } = data;
            setEqAlerts([...eq_data]);

            if (is_first_pass) {
                setFirstPass(false);
                setEqAlTblPage({ ...eq_al_tbl_pagination, count });
            }
        });
    }, [eq_al_tbl_pagination, is_first_pass]);

    const is_main_page = location.pathname === path;

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Site Data Analytics"
                    customButtons={is_desktop && is_main_page ? CustomButtons(change_consolidate_modal_fn, open_eq_modal) : false}
                />
            </div>

            <div className={classes.pageContentMargin}>
                <Switch location={location}>
                    <Route exact path={url} render={
                        props => (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6} lg={3}>
                                    {
                                        surficial_dp_option !== null ? (
                                            <Paper elevation={2}>
                                                <HighchartsReact
                                                    highcharts={Highcharts}
                                                    options={surficial_dp_option}
                                                    callback={save_chart_instances_fn("surficial")}
                                                    allowChartUpdate={false}
                                                />
                                                {surficial_custom_label}
                                            </Paper>
                                        ) : (
                                            <MyLoader style={{ height: "100%" }}/>
                                        )
                                    }
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    {
                                        rainfall_dp_option !== null ? (
                                            <Paper elevation={2}>
                                                <HighchartsReact
                                                    highcharts={Highcharts}
                                                    options={rainfall_dp_option}
                                                    callback={save_chart_instances_fn("rainfall")}
                                                    allowChartUpdate={false}
                                                />
                                                {rainfall_custom_label}
                                            </Paper>
                                        ) : (
                                            <MyLoader style={{ height: "100%" }}/>
                                        )
                                    }
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    {
                                        subsurface_dp_option !== null ? (
                                            <Paper elevation={2}>
                                                <HighchartsReact
                                                    highcharts={Highcharts}
                                                    options={subsurface_dp_option}
                                                    callback={save_chart_instances_fn("subsurface")}
                                                    allowChartUpdate={false}
                                                />
                                                {subsurface_custom_label}
                                            </Paper>
                                        ) : (
                                            <MyLoader style={{ height: "100%" }}/>
                                        )
                                    }
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    {
                                        loggers_dp_option !== null ? (
                                            <Paper elevation={2}>
                                                <HighchartsReact
                                                    highcharts={Highcharts}
                                                    options={loggers_dp_option}
                                                    callback={save_chart_instances_fn("loggers")}
                                                    allowChartUpdate={false}
                                                />
                                            </Paper>
                                        ) : (
                                            <MyLoader style={{ height: "100%" }}/>
                                        )
                                    }
                                </Grid>

                                <Grid item xs={12}>
                                    {
                                        rainfall_summary_option !== null ? (
                                            <Paper elevation={2}>
                                                <HighchartsReact
                                                    highcharts={Highcharts}
                                                    options={rainfall_summary_option}
                                                />
                                            </Paper>
                                        ) : (
                                            <div>Loading...</div>
                                        )
                                    }
                                </Grid>

                                <Grid item xs={12} md={12} lg={7}>
                                    <Paper elevation={2}>
                                        <EarthquakeContainer
                                            eqEvents={eq_events}
                                            eqAlerts={eq_alerts}
                                            eqAlertsPagination={eq_al_tbl_pagination}
                                            setEqAlTblPage={setEqAlTblPage}
                                        />
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={12} lg={5}>
                                    <Paper elevation={2}>
                                        <MUIDataTable
                                            title="Latest MOMs Alert"
                                            columns={moms_table_options}
                                            options={{
                                                textLabels: {
                                                    body: {
                                                        noMatch: "No data"
                                                    }
                                                },
                                                selectableRows: "none",
                                                rowsPerPage: 6,
                                                rowsPerPageOptions: [],
                                                print: false,
                                                download: false,
                                                viewColumns: false,
                                                responsive: "scrollMaxHeight"
                                            }}
                                            data={moms_alerts}
                                        />
                                    </Paper>
                                </Grid>
                            </Grid>
                        )
                    }/>

                    <Route path={`${url}/surficial/:site_code`} render={
                        props => (
                            <SurficialGraph
                                {...props}
                                width={width}
                            />
                        )
                    }/>

                    <Route path={`${url}/rainfall/:rain_gauge`} render={
                        props => <RainfallGraph 
                            {...props}
                            width={width}
                        />} 
                    />

                    <Route path={`${url}/subsurface/:tsm_sensor`} render={
                        props => <SubsurfaceGraph 
                            {...props}
                            width={width}
                        />} 
                    />

                    <Route path={`${url}/moms/:site_code`} render={
                        props => <MomsInstancesPage
                            {...props}
                            width={width}
                        />} 
                    />

                    <Route path={`${url}/consolidated/:site_code`} render={
                        props => <ConsolidatedSiteCharts
                            {...props}
                            width={width}
                        />} 
                    />
                </Switch>
            </div>

            <ConsolidateSiteChartsModal
                isOpen={is_consolidate_modal_open}
                clickHandler={change_consolidate_modal_fn(false)}
                url={url}
            />
            <InsertEarthquakeModal
                isOpen={is_earthquake_modal}
                clickHandler = {open_eq_modal(false)}
                setReloadEqEvent = {setReloadEqEvent}
            />
        </Fragment>
    );
}

export default withWidth()(Container);