import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highcharts.src";
import HighchartsReact from "highcharts-react-official";

function getStackedBarChartOptions (processed_data, input) {
    const { site, year } = input;
    const subtitle = `Year: <b>${year}</b><br/>` +
    `Site: <b>${site ? site.label : "All"}</b>`;

    return {
        chart: {
            type: "column"
        },
        title: {
            text: "<b>Monthly Monitoring Event Alerts</b>",
            y: 22
        },
        subtitle: {
            text: subtitle,
            style: { fontSize: "0.75rem" }
        },
        series: processed_data,
        xAxis: {
            categories: ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"],
            // text: "Month"
        },
        yAxis: {
            min: 0,
            title: {
                text: "<b>Number of heightened alerts</b>"
            },
            stackLabels: {
                enabled: true,
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
            // align: "right",
            // x: -30,
            // verticalAlign: "top",
            // y: 25,
            // floating: true,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || "white",
            borderColor: "#CCC",
            borderWidth: 1,
            shadow: false,
            reversed: true
        },
        tooltip: {
            headerFormat: "<b>{point.x}</b><br/>",
            pointFormat: "{series.name}: {point.y}<br/>Total: {point.stackTotal}"
        },
        plotOptions: {
            column: {
                stacking: "normal",
                dataLabels: {
                    enabled: true,
                    formatter () {
                        if (this.y === 0) return "";
                        return this.y;
                    },
                }
            }
        },
        loading: {
            hideDuration: 2000
        },
        lang: {
            noData: "No alert within this period"
        },
        credits: {
            enabled: false
        }
    };
}

function applyColor (processed_data, colors) {
    const temp = [];
    processed_data.forEach((row, index) => {
        const updated = {
            ...row,
            color: colors[index]
        };
        temp.push(updated);
    });
    return temp;
}

function StackedBarChart (props) {
    const { 
        highcharts, data, colors,
        isLoading, input
    } = props;
    const [chart, setChart] = useState(null);

    let data_with_color = [];
    if (data !== null) {
        data_with_color = applyColor(data, colors);
        data_with_color.reverse();
    }
    const [chart_option, setChartOption] = useState(getStackedBarChartOptions(data_with_color, input));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);

    useEffect(() => {
        let to_show = false;
        if (chart !== null && data !== null) {
            setChartOption(getStackedBarChartOptions(data_with_color, input));

            if (data.length === 0) to_show = true;

            if (to_show) chart.showNoData();
            else chart.hideNoData();
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

export default (StackedBarChart);