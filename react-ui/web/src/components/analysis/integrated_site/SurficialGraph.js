import React, { Fragment, useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import moment from "moment";
import { Button, ButtonGroup, withStyles } from "@material-ui/core";
import GeneralStyles from "../../../GeneralStyles";

const goBack = (history, backHandler) => e => {
    e.preventDefault();
    backHandler();
    // history.goBack();
    history.push("/analysis/sites");
    history.replace("/analysis/sites");
};

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
            }
        },
        subtitle: {
            text: `${subtext}As of: <b>${moment(end_date).format("D MMM YYYY, HH:mm")}</b>`,
            style: { fontSize: "13px" }
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
        credits: {
            enabled: false
        }
    };
}

function SurficialGraph (props) {
    const { classes, history, match: { params: { site_code } }, backHandler } = props;
    const [timestamps, setTimestamps] = useState({ start: "2018-11-08 00:00:00", end: "2019-01-09 00:00:00" });
    const [surficial_data, setSurficialData] = useState([]);
    const [markers, setMarkers] = useState([]);

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
        <div className="page">
            { /** * marginBottom: "-40px", marginTop: 20, ***/ }
            <div className={classes.pageContentMargin} style={{ marginRight: 18, position: "relative", zIndex: 2 }}>                
                <Button variant="contained" color="primary" size="small" onClick={goBack(history, backHandler)}>
                    Back
                </Button>
                <ButtonGroup
                    color="secondary"
                    size="large"
                    aria-label="Large outlined secondary button group"
                >
                    <Button>One</Button>
                    <Button>Two</Button>
                    <Button>Three</Button>
                </ButtonGroup> 
            </div>

            <div className={classes.pageContentMargin}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
        </div>
    );
}

export default withStyles(GeneralStyles)(SurficialGraph);
