import React, { Fragment } from "react";
import Highcharts from "highcharts/highcharts.src";
import HighchartsReact from "highcharts-react-official";

function stackedBarChartOptions (processed_data) {
    processed_data.reverse();

    return {
        chart: {
            type: "column"
        },
        title: {
            text: "Stacked column chart"
        },
        xAxis: {
            categories: ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"]
        },
        yAxis: {
            min: 0,
            title: {
                text: "Alerts total"
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
            pointFormat: "{series.name}: {point.y}<br/>Total: {point.stackTotal}"
        },
        plotOptions: {
            column: {
                stacking: "normal",
                dataLabels: {
                    enabled: true
                }
            }
        },
        series: processed_data
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
    const { highcharts, processed_data, colors } = props;
    const data_with_color = applyColor(processed_data, colors);
    const chart_option = stackedBarChartOptions(data_with_color);

    return (
        <Fragment>
            <HighchartsReact highcharts={highcharts} options={chart_option} />
        </Fragment>
    );
}

export default (StackedBarChart);