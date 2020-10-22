import React, { useState, useEffect } from "react";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

function donutChartOption (processed_data) {
    const categories = [
        "Alert 1",
        "Alert 2",
        "Alert 3"
    ];
    const data = processed_data;
    const alerts_data = [];
    const trigger_count = [];
    let i;
    let j;
    const data_length = data.length;
    let drill_data_length;

    // Build the data arrays
    for (i = 0; i < data_length; i += 1) {

        // add alert data
        alerts_data.push({
            name: categories[i],
            y: data[i].y,
            color: data[i].color
        });
  
        // add drilldown data
        drill_data_length = data[i].drilldown.data.length;
        for (j = 0; j < drill_data_length; j += 1) {
            trigger_count.push({
                name: data[i].drilldown.categories[j],
                y: data[i].drilldown.data[j],
                color: data[i].color
            });
        }
    }

    return { alerts_data, trigger_count };
}

function getPieChartOption (processed_data, input) {
    const { site, start_ts, end_ts } = input;

    const ts_format = "DD MMM YYYY, HH:mm";
    const subtitle = `Range: <b>${moment(start_ts).format(ts_format)} - ${moment(end_ts).format(ts_format)}</b><br/>` +
    `Site: <b>${site ? site.label : "All"}</b>`;
    const { alerts_data, trigger_count } = donutChartOption(processed_data);
    return {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie"
        },
        title: {
            text: "<b>Monitoring Event Alerts Summary</b>",
            y: 22
        },
        subtitle: {
            text: subtitle,
            style: { fontSize: "0.75rem" }
        },
        accessibility: {
            point: {
                valueSuffix: "%"
            }
        },
        plotOptions: {
            pie: {
                shadow: false,
                center: ["50%", "50%"]
            }
        },
        series: [{
            name: "Alerts",
            data: alerts_data,
            size: "60%",
            tooltip: {
                pointFormat: "<b>{point.percentage:.1f}%</b>"
            },
            dataLabels: {
                formatter () {
                    return this.y > 5 ? this.point.name : null;
                },
                color: "#ffffff",
                distance: -30
            }
        }, {
            name: "Count",
            data: trigger_count,
            size: "80%",
            innerSize: "60%",
            dataLabels: {
                formatter () {
                // display only if larger than 1
                    return this.y > 1 ? `<b>${ this.point.name }:</b> ${ 
                        this.y}` : null;
                }
            },
            id: "versions"
        }],
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

function PieChart (props) {
    const {
        highcharts, data, colors,
        isLoading, input
    } = props;
    const [chart, setChart] = useState(null);

    let data_with_color = [];
    if (data !== null) data_with_color = applyColor(data, colors);
    const [chart_option, setChartOption] = useState(getPieChartOption(data_with_color, input));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);

    useEffect(() => {
        let to_show = false;
        if (chart !== null && data !== null) {
            setChartOption(getPieChartOption(data_with_color, input));

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

export default (PieChart);