import React, { useState, useEffect, Fragment } from "react";
import { Route, Link } from "react-router-dom";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import moment from "moment";

import { 
    Button, ButtonGroup, withStyles,
    Paper
} from "@material-ui/core";
import { ArrowDropDown } from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";

import GeneralStyles from "../../../GeneralStyles";
import SurficialTrendingGraphs from "./SurficialTrendingGraphs";
import BackToMainButton from "./BackToMainButton";

import getSurficialPlotData from "../ajax";

const hideTrending = history => e => {
    e.preventDefault();
    history.goBack();
};

function prepareOptions (input, data, width) {
    const subtext = "";
    const { site_code, timestamps } = input;
    const { start, end } = timestamps;
    const start_date = moment(start, "YYYY-MM-DD HH:mm:ss");
    const end_date = moment(end, "YYYY-MM-DD HH:mm:ss");

    const font_size = isWidthDown(width, "sm") ? "1rem" : "0.90rem";

    return {
        title: {
            text: `<b>Surficial Data History Chart of ${site_code.toUpperCase()}</b>`,
            style: { fontSize: font_size },
            margin: 36,
            y: 18
        },
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
        yAxis: {
            title: {
                text: "<b>Displacement (cm)</b>"
            }
        },
        xAxis: {
            min: Date.parse(start_date),
            max: Date.parse(end_date),
            type: "datetime",
            dateTimeLabelFormats: {
                month: "%e. %b %Y",
                year: "%b"
            },
            title: {
                text: "<b>Date</b>"
            }
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
                cursor: "pointer"
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

// eslint-disable-next-line max-params
function createSurficialGraph (input, surficial_data, chartRef, width = "md") {
    const options = prepareOptions(input, surficial_data, width);

    return <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
    />;
    
}

function SurficialGraph (props) {
    const { 
        classes, history, width,
        match: { url, params: { site_code } }
    } = props;
    const chartRef = React.useRef(null);
    const [timestamps, setTimestamps] = useState({ start: "2018-11-08 00:00:00", end: "2019-01-09 00:00:00" });
    const [surficial_data, setSurficialData] = useState([]);

    useEffect(() => {
        if (chartRef.current !== null)
            chartRef.current.chart.showLoading();

        getSurficialPlotData(site_code, timestamps, data => {
            setSurficialData(data);

            if (chartRef.current !== null)
                chartRef.current.chart.hideLoading();
        });
    }, [timestamps]);

    const input = { site_code, timestamps };
    const graph_component = createSurficialGraph(input, surficial_data, chartRef, width);

    return (
        <Fragment>
            <div style={{ display: "flex", justifyContent: "space-between" }}>                
                <BackToMainButton {...props} />

                { surficial_data.length > 0 && (
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

            <Route path={`${url}/:marker_name`} render={
                props => <SurficialTrendingGraphs 
                    {...props}
                    timestamps={timestamps}
                    hideTrending={hideTrending}
                />} 
            />
        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SurficialGraph);
