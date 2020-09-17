import React, { Fragment } from "react";
import HighchartsReact from "highcharts-react-official";

function pieChartOption (processed_data) {
    return {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie"
        },
        title: {
            text: "Alert Summary based on date specified"
        },
        tooltip: {
            pointFormat: "<b>{point.percentage:.1f}%</b>"
        },
        accessibility: {
            point: {
                valueSuffix: "%"
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                    enabled: true,
                    format: "{point.name}: {point.percentage:.1f} %"
                }
            }
        },
        series: [{
            name: "Count",
            colorByPoint: true,
            data: processed_data
        }]
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

function PieChart (props) {
    const { highcharts, processed_data, colors } = props;
    const data_with_color = applyColor(processed_data, colors);
    const chart_option = pieChartOption(data_with_color);
    return (
        <Fragment>
            <HighchartsReact highcharts={highcharts} options={chart_option} />
        </Fragment>
    );
     
}

export default (PieChart);