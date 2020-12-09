import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highcharts.src";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

function getEWISmsChartOption (processed_data, input, type) {
    const { start_ts, end_ts } = input;
    const subtitle = `Range <b>${moment(start_ts).format("DD MMM YYYY, HH:ss")} - ${moment(end_ts).format("DD MMM YYYY, HH:ss")}<br>All sites</b>`;
    const { month, sent, queud } = processed_data;
    return {
        chart: {
            type: "column"
        },
        title: {
            text: `${type} count of DSL EWI sent according to protocol`
        },
        subtitle: {
            text: subtitle
        },
        xAxis: {
            categories: month
        },
        yAxis: {
            min: 0,
            title: {
                text: "EWI SMS Percentage"
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
            name: "Queued",
            data: queud,
            pointPadding: 0
        }, {
            name: "Sent",
            data: sent,
            pointPadding: 0.1
        }]
    };
}

function EwiChart (props) {
    const { 
        highcharts, data,
        isLoading, input, type
    } = props;
    const [chart, setChart] = useState(null);
    const default_data = {
        month: [],
        sent: [],
        queud: [],
    };
    const [chart_option, setChartOption] = useState(getEWISmsChartOption(default_data, input, type));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);                  

    useEffect(() => {
        if (chart !== null && data !== null) {
            if (data) {
                setChartOption(getEWISmsChartOption(data, input, type));
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

export default (EwiChart);