import React, { Fragment, useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import moment from "moment";
import { Button, ButtonGroup, withStyles, IconButton, Paper } from "@material-ui/core";
import { Route, Link } from "react-router-dom";
import { ArrowBackIos } from "@material-ui/icons";
import GeneralStyles from "../../../GeneralStyles";

function prepareOptions (site_code, timestamps, data) {
    const subtext = "";
    const { start, end } = timestamps;
    const start_date = moment(start, "YYYY-MM-DD HH:mm:ss");
    const end_date = moment(end, "YYYY-MM-DD HH:mm:ss");

    return {
        title: {
            text: `<b>Surficial Data History Chart of ${site_code.toUpperCase()}</b>`,
            style: { fontSize: "1rem" },
            margin: 36
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
            hideDuration: 1000
        },
        credits: {
            enabled: false
        }
    };
}


function SurficialTrendingGraphs (props) {
    const { 
        classes, timestamps, hideTrending, history,
        match: { url, params: { marker_name } }
    } = props;
    const [surficial_data, setSurficialData] = useState([]);
    const site_code = "agb";

    const api_link = `http://127.0.0.1:5000/api/surficial/get_surficial_plot_data/` +
        `${site_code}/${timestamps.start}/${timestamps.end}`;

    useEffect(() => {
        axios.get(api_link)
        .then(response => {
            const { data } = response;
            console.log(data);
            setSurficialData(data);
        })
        .catch(error => {
            console.log(error);
        });
    }, [timestamps]);

    const options = prepareOptions(site_code, timestamps, surficial_data);

    return (
        <Fragment>
            <div className={classes.pageContentMargin} style={{ textAlign: "right", marginTop: 24 }}>                
                <Button
                    variant="contained"
                    onClick={hideTrending(history)}
                    color="primary"
                    size="small"
                >
                    Hide
                </Button>
            </div>

            <div className={classes.pageContentMargin} style={{ marginTop: 24 }}>
                <Paper>
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                    />
                </Paper>
            </div>
        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SurficialTrendingGraphs);
