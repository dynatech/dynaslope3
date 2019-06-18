import React, { Component, Fragment } from "react";
import { createPortal } from "react-dom";
import { Button, Grid } from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { withStyles } from "@material-ui/core/styles";
import { Route, Switch, Link } from "react-router-dom";
import { compose } from "recompose";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import { ShowChart } from "@material-ui/icons";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "../../../transitions.css";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import { sites, data_presence_rain_gauges, data_presence_tsm } from "../../../store";
import SurficialGraph from "./SurficialGraph";
import RainfallGraph from "./RainfallGraph";
import SubsurfaceGraph from "./SubsurfaceGraph";

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

function generateData (data_list, type, isMobile) {
    const data = [];
    let x = 0;

    data_list.forEach((row, i) => {
        let label;
        let value;
        if (type === "surficial") {
            label = row.site_code;
            value = Math.round(Math.random());
        } else if (type === "rainfall") {
            label = row.rain_gauge.gauge_name;
            value = row.presence;
        } else {
            label = row.tsm_sensor.logger.logger_name;
            value = row.presence;
        }

        const y = isMobile ? i % 5 : i % 10;
        const a = {
            x: y, // x : y,
            y: 5 - x, // 10 - y : 5 - x,
            value,
            label: label.toUpperCase(),
            data: label,
            type
        };
        data.push(a);
        
        const cond = isMobile ? i % 5 === 4 : i % 10 === 9;
        if (cond) x += 1;
    });

    return data;
}

function prepareOptions (isMobile, type) {
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
            height = 80;
            additional_height = 100;
            // fallthrough
        default:
            break;
    }

    if (isMobile)
        height += additional_height;

    const data = generateData(data_list, type, isMobile);

    const options = {
        chart: {
            type: "heatmap",
            height: `${height }%`
        },
        title: {
            text: title,
            style: { fontSize: "1rem" }
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
                const { label, type, value } = this.point;
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
                        // fallthrough
                    default:
                        break;
                }

                return `${type_label}: <b>${label}</b><br/>` + 
                   `Presence: <b>${presence} data</b><br/>`;
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

function createLabelComponent (url, p) {
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

function createCustomLabels (chart, url) {
    const custom_labels = [];
    if (chart && Object.keys(chart).length !== 0 && chart.xAxis[0]) {
        chart.series[0].points.forEach(p => {
            custom_labels.push(createLabelComponent(url, p));
        });
    }
    return custom_labels;
}

class Container extends Component {
    constructor (props) {
        super(props);

        const { location: { pathname }, match: { path }, width } = this.props;
        const bool = pathname !== path;
        const isMobile = isWidthUp(width, "sm");

        this.afterSurficialChartCreated = this.afterSurficialChartCreated.bind(this);
        this.afterRainfallChartCreated = this.afterRainfallChartCreated.bind(this);
        this.afterTSMChartCreated = this.afterTSMChartCreated.bind(this);

        this.state = {
            hasSelected: bool,
            surficial_options: prepareOptions(isMobile, "surficial"),
            rainfall_options: prepareOptions(isMobile, "rainfall"),
            tsm_options: prepareOptions(isMobile, "subsurface")
        };
        
        this.charts = {};
    }

    changeHasSelected = (bool) => () => {
        this.setState({
            hasSelected: bool
        });
    }

    afterSurficialChartCreated = chart => {
        this.charts.surficial = chart;
        this.forceUpdate();
    }

    afterRainfallChartCreated = chart => {
        this.charts.rainfall = chart;
        this.forceUpdate();
    }

    afterTSMChartCreated = chart => {
        this.charts.subsurface = chart;
        this.forceUpdate();
    }

    render () {
        const { classes, match: { url }, location } = this.props;
        const { surficial_options, rainfall_options, tsm_options, hasSelected } = this.state;
        const { charts } = this;

        const surficial_custom_labels = createCustomLabels(charts.surficial, url);
        const rainfall_custom_labels = createCustomLabels(charts.rainfall, url);
        const tsm_custom_labels = createCustomLabels(charts.subsurface, url);

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle
                        title="Analysis | Site Data Analytics"
                    />
                </div>

                {/* <TransitionGroup>
                    <CSSTransition
                        key={location.key}
                        in={hasSelected}
                        timeout={{ enter: 800, exit: 800 }}
                        classNames="slider"
                        mountOnEnter={false}
                        unmountOnExit
                    >
                        <div className={ location.pathname === url ? "right" : "left"}> */}
                <Switch location={location}>
                    <Route exact path={url} render={
                        props => (
                            <div className={classes.pageContentMargin}>
                                <Grid container>
                                    <Grid item xs={12} md={6}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={surficial_options}
                                            callback={ this.afterSurficialChartCreated }
                                        />
                                        {surficial_custom_labels}
                                    </Grid>
                                
                                    <Grid item xs={12} md={6}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={rainfall_options}
                                            callback={ this.afterRainfallChartCreated }
                                        />
                                        {rainfall_custom_labels}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={tsm_options}
                                            callback={ this.afterTSMChartCreated }
                                        />
                                        {tsm_custom_labels}
                                    </Grid>
                                </Grid>
                            </div>
                        )}
                    />

                    <Route path={`${url}/surficial/:site_code`} render={
                        props => <SurficialGraph 
                            {...props}
                            backHandler={this.changeHasSelected(false)}
                        />} 
                    />

                    <Route path={`${url}/rainfall/:rain_gauge`} render={
                        props => <RainfallGraph 
                            {...props}
                            backHandler={this.changeHasSelected(false)}
                        />} 
                    />

                    <Route path={`${url}/subsurface/:tsm_sensor`} render={
                        props => <SubsurfaceGraph 
                            {...props}
                            backHandler={this.changeHasSelected(false)}
                        />} 
                    />
                </Switch>
                {/* </div>
                    </CSSTransition>
                </TransitionGroup> */}
            </Fragment>
        );
    }
}

export default compose(withWidth(), withStyles(styles))(Container);
