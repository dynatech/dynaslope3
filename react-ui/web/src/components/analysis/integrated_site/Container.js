import React, { 
    Fragment, useState, 
    useEffect
} from "react";
import { createPortal } from "react-dom";

import {
    withStyles, Button, Grid,
    Paper, Typography
} from "@material-ui/core";
import { InsertChart } from "@material-ui/icons";
import withWidth, { isWidthDown } from "@material-ui/core/withWidth";
import { Route, Switch, Link } from "react-router-dom";

import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import { compose } from "recompose";
import moment from "moment";
import MUIDataTable from "mui-datatables";

import SurficialGraph from "./SurficialGraph";
import RainfallGraph from "./RainfallGraph";
import SubsurfaceGraph from "./SubsurfaceGraph";
import ConsolidatedSiteCharts from "./ConsolidatedSiteCharts";
import ConsolidateSiteChartsModal from "./ConsolidateSiteChartsModal";
import EarthquakeContainer from "./EarthquakeContainer";
import MomsInstancesPage from "./MomsInstancesPage";

import { getMOMsAlertSummary, getEarthquakeEvents, getEarthquakeAlerts } from "../ajax";
// sample data
import { 
    sites, data_presence_rain_gauges, 
    data_presence_tsm, data_presence_loggers 
} from "../../../store";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import { prepareSiteAddress } from "../../../UtilityFunctions";


const styles = theme => {
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
};

function CustomButtons (change_consolidate_modal_fn) {
    return <span>
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

function prepareOptions (is_mobile, type) {
    const uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    const title = `<b>${uc_type} Data Availability</b>`;

    let data_list;
    let height = 50;
    let additional_height = 60;
    
    switch (type) {
        case "surficial":
            data_list = sites;
            break;
        case "rainfall":
            data_list = data_presence_rain_gauges;
            break;
        case "subsurface":
            data_list = data_presence_tsm;
            height = 85;
            additional_height = 100;
            break;
        case "loggers":
            data_list = data_presence_loggers;
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
            text: "Timestamp: <b>29 December 2019, 11:30:00</b>",
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
                const format_str = "D MMM YYYY, HH:mm";
                
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

                return `${type_label}: <b>${label}</b><br/>` + 
                   `Presence: <b>${presence} data</b><br/>` + 
                   `Last data timestamp: <b>${moment(ts_last_data).format(format_str)}</b><br/>` +
                   `Last update timestamp: <b>${moment(ts_updated).format(format_str)}</b><br/>` +
                   `Days since last data: <b>${diff_days}</b><br/>`;
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

function generateData (data_list, type, is_mobile) {
    const data = [];
    let x = 0;

    data_list.forEach((row, i) => {
        const { last_data, ts_updated, diff_days } = row;

        let label;
        let value;
        if (type === "surficial") {
            label = row.site_code;
            value = Math.round(Math.random());
        } else if (type === "rainfall") {
            label = row.rain_gauge.gauge_name;
            value = row.presence;
        } else if (type === "subsurface") {
            label = row.tsm_sensor.logger.logger_name;
            value = row.presence;
        } else {
            label = row.logger.logger_name;
            value = row.presence;
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
            diff_days: diff_days !== undefined ? diff_days : Math.round(Math.random() * 10)
        };
        data.push(a);
        
        // const cond = is_mobile ? i % 5 === 4 : i % 10 === 9;
        const cond = i % 5 === 4;
        if (cond) x += 1;
    });

    return data;
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
                        textDecoration: "none", 
                        fontSize: dataLabel.options.style.fontSize, 
                        fontWeight: 800,
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

function Container (props) {
    const {
        classes, width, location,
        match: { path, url }
    } = props;
    const is_desktop = isWidthDown(width, "sm");

    const [is_consolidate_modal_open, setIsConsolidateModalOpen] = useState(false);
    const change_consolidate_modal_fn = bool => () => setIsConsolidateModalOpen(bool);

    const [chart_instances, setChartInstances] = useState({});
    const [options, setOptions] = useState({
        surficial: prepareOptions(!is_desktop, "surficial"),
        rainfall: prepareOptions(!is_desktop, "rainfall"),
        subsurface: prepareOptions(!is_desktop, "subsurface"),
        loggers: prepareOptions(!is_desktop, "loggers")
    });
    const [custom_labels, setCustomLabels] = useState({});

    const save_chart_instances_fn = name => chart => {
        setChartInstances(prev => ({ ...prev, [name]: chart }));
    };

    // useEffect(() => {
    //     Object.keys(chart_instances).forEach(key => {
    //         setCustomLabels({ ...custom_labels, [key]: createCustomLabels(chart_instances[key], url) });
    //     });
    // });

    const [moms_alerts, setMOMsAlerts] = useState([]);
    useEffect(() => {
        const table_data = [];
        getMOMsAlertSummary((data) => {
            data.forEach(site => {
                const { site_code, moms_alert } = site;
                const address = prepareSiteAddress(site, true, "start");
                const site_entry = <Link to={`${url}/moms/${site_code}`} style={{ color: "black" }}>{address}</Link>;
                const arr = [site_entry, moms_alert];
                table_data.push(arr);
            });

            setMOMsAlerts(table_data);
        });  
    }, []);

    const temp = {};
    Object.keys(chart_instances).forEach(key => {
        temp[key] = createCustomLabels(chart_instances[key], url);
    });

    const [eq_events, setEqEvents] = useState([]);
    useEffect(() => {
        getEarthquakeEvents(data => {
            setEqEvents(data);
        });
    }, []);

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
    }, [eq_al_tbl_pagination]);

    const is_main_page = location.pathname === path;

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Site Data Analytics"
                    customButtons={is_desktop && is_main_page ? CustomButtons(change_consolidate_modal_fn) : false}
                />
            </div>

            <div className={classes.pageContentMargin}>
                <Switch location={location}>
                    <Route exact path={url} render={
                        props => (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper elevation={2}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={options.surficial}
                                            callback={save_chart_instances_fn("surficial")}
                                            allowChartUpdate={false}
                                        />
                                        {temp.surficial}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper elevation={2}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={options.rainfall}
                                            callback={save_chart_instances_fn("rainfall")}
                                            allowChartUpdate={false}
                                        />
                                        {temp.rainfall}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper elevation={2}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={options.subsurface}
                                            callback={save_chart_instances_fn("subsurface")}
                                            allowChartUpdate={false}
                                        />
                                        {temp.subsurface}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper elevation={2}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={options.loggers}
                                            callback={save_chart_instances_fn("loggers")}
                                            allowChartUpdate={false}
                                        />
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={12} lg={6}>
                                    <Paper elevation={2}>
                                        <EarthquakeContainer
                                            eqEvents={eq_events}
                                            eqAlerts={eq_alerts}
                                            eqAlertsPagination={eq_al_tbl_pagination}
                                            setEqAlTblPage={setEqAlTblPage}
                                        />
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={12} lg={6}>
                                    <Paper elevation={2}>
                                        <MUIDataTable
                                            title="Latest MOMs Alert"
                                            columns={["Site", "Alert"]}
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
                                                responsive: "scroll"
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
        </Fragment>
    );
}

export default compose(withWidth(), withStyles(styles))(Container);