import React, { useState, useEffect } from "react";
import HighchartsReact from "highcharts-react-official";
import moment from "moment";

function getPieChartOption (processed_data, input) {
    const { site, start_ts, end_ts } = input;

    const ts_format = "DD MMM YYYY, HH:mm";
    const subtitle = `Range: <b>${moment(start_ts).format(ts_format)} - ${moment(end_ts).format(ts_format)}</b><br/>` +
    `Site: <b>${site ? site.label : "All"}</b>`;

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
                    format: "{point.name}: {point.y}"
                }
            }
        },
        series: [{
            name: "Count",
            colorByPoint: true,
            data: processed_data
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