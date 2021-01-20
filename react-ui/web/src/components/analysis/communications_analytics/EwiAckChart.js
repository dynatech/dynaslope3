import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highcharts.src";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

function getEwiAckChartOption (processed_data, input, type) {
    const { start_ts, end_ts, site } = input;

    let site_label = "All sites";
    let title = "Day of the Week";
    if (type === "hour") {
        title = "Time of the Day";
        if (site !== "" && site !== null) {
            const { label } = site;
            if (label !== undefined) site_label = `${label}`;
        }
    }

    const subtitle = `Range <b>${moment(start_ts).format("DD MMM YYYY, HH:ss")} - ${moment(end_ts).format("DD MMM YYYY, HH:ss")}<br>${site_label}</b>`;
    const { days, data, hours } = processed_data;
    return {
        chart: {
            type: "column"
        },
        title: {
            text: `<b>${title} Stakeholders are Most Responsive</b>`,
            style: { fontSize: "14px" },
            margin: 20,
            y: 16
        },
        subtitle: {
            text: subtitle,
            style: { fontSize: "12px" }
        },
        xAxis: {
            categories: days || hours
        },
        yAxis: {
            min: 0,
            title: {
                text: "<b>EWI SMS Acknowledgement</b>"
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
        tooltip: {
            headerFormat: "<b>{point.x}</b><br/>",
            pointFormat: "Total: {point.stackTotal}"
        },
        plotOptions: {
            column: {
                stacking: "normal",
                dataLabels: {
                    enabled: true
                }
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            showInLegend: false,
            data,
            color: "#434348"
        }]
    };
}

function EwiAckChart (props) {
    const { 
        highcharts, data, isLoading, input, type
    } = props;
    const [chart, setChart] = useState(null);
    
    let default_data;
    if (type === "Daily") {
        default_data = {
            days: [],
            data: []
        };
    } else {
        default_data = {
            hours: [],
            data: []
        };
    }
    const [chart_option, setChartOption] = useState(getEwiAckChartOption(default_data, input, type));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);                  

    useEffect(() => {
        if (chart !== null && data !== null) {
            if (data) {
                setChartOption(getEwiAckChartOption(data, input, type));
            }
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

export default EwiAckChart;