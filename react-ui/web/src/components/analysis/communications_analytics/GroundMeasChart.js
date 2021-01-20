import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highcharts.src";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

function getGroundMeasSiteOptions (processed_data, input) {
    const { start_ts, end_ts } = input;
    const subtitle = `Range <b>${moment(start_ts).format("DD MMM YYYY, HH:ss")} - ${moment(end_ts).format("DD MMM YYYY, HH:ss")}</b>`;
    const { sites, expected, received } = processed_data;
    return {
        chart: {
            type: "column"
        },
        title: {
            text: "<b>Ground Measurement Data Received per Site</b>",
            style: { fontSize: "14px" },
            margin: 20,
            y: 16
        },
        subtitle: {
            text: subtitle,
            style: { fontSize: "12px" }
        },
        xAxis: {
            categories: sites,
            title: {
                text: "<b>Sites</b>"
            },
        },
        yAxis: {
            min: 0,
            // max: 100,
            title: {
                text: "<b>No. of Ground Measurement Data</b>"
            },
            stackLabels: {
                enabled: false,
                style: {
                    fontWeight: "bold",
                    color: ( // theme
                        Highcharts.defaultOptions.title.style &&
                        Highcharts.defaultOptions.title.style.color
                    ) || "gray"
                }
            }
        },
        legend: {
            align: "right",
            x: -30,
            verticalAlign: "top",
            y: 25,
            floating: true,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || "white",
            borderColor: "#CCC",
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: "<b>{point.x}</b><br/>",
            pointFormat: "{series.name}: {point.y}"
        },
        plotOptions: {
            column: {
                grouping: false,
                shadow: false,
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: "Expected",
            data: expected,
            pointPadding: 0
        }, {
            name: "Received",
            data: received,
            pointPadding: 0.2
        }]
    };
}

function GroundMeasChart (props) {
    const { 
        highcharts, data,
        isLoading, input
    } = props;
    
    const [chart, setChart] = useState(null);

    const [chart_option, setChartOption] = useState(getGroundMeasSiteOptions({
        sites: null
    }, input));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);

    useEffect(() => {
        if (chart !== null && data !== null) {
            setChartOption(getGroundMeasSiteOptions(data, input));
        }
    }, [chart, data]);

    return (
        <HighchartsReact
            highcharts={highcharts}
            options={chart_option}
            callback={x => setChart(x)}
        />
    );
}

export default GroundMeasChart;