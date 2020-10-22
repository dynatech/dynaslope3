import React, { useState, useEffect } from "react";

import HighchartsReact from "highcharts-react-official";
import moment from "moment";
import Chroma from "chroma-js";

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
        const { y, color, drilldown } = data[i];
        // add alert data
        alerts_data.push({
            name: categories[i],
            y,
            color
        });
  
        // add drilldown data
        const { data: d_data, categories: d_categories, trigger_events } = drilldown;
        drill_data_length = d_data.length;
        for (j = 0; j < drill_data_length; j += 1) {
            trigger_count.push({
                name: d_categories[j],
                y: d_data[j],
                color: Chroma(color).brighten((j + 1) * 0.50)
                .hex(),
                alert_events: trigger_events[j]
            });
        }
    }

    return { alerts_data, trigger_count };
}

// eslint-disable-next-line max-params
function getPieChartOption (processed_data, input, setSelectedTrigger, chart) {
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
                // shadow: true,
                center: ["50%", "50%"]
            }
        },
        series: [{
            name: "Alerts",
            data: alerts_data,
            size: "80%",
            tooltip: {
                pointFormat: "Count: <b>{point.y} ({point.percentage:.1f}%)</b>"
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
                    return this.y > 1 ? `<b>${this.point.name}:</b> ${ 
                        this.y}` : null;
                }
            },
            point: {
                events: {
                    click (event) {
                        const { point: {
                            alert_events, name
                        } } = event; 
                        setSelectedTrigger({ alert_events, name });
                        chart.reflow();
                    }
                }
            }
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
        isLoading, input, setSelectedTrigger
    } = props;
    const [chart, setChart] = useState(null);

    let data_with_color = [];
    if (data !== null) data_with_color = applyColor(data, colors);
    const [chart_option, setChartOption] = useState(getPieChartOption(data_with_color, input, setSelectedTrigger, chart));

    useEffect(() => {
        if (chart !== null) {
            if (isLoading) chart.showLoading();
            else chart.hideLoading();
        }
    }, [chart, isLoading]);

    useEffect(() => {
        let to_show = false;
        if (chart !== null && data !== null) {
            setChartOption(getPieChartOption(data_with_color, input, setSelectedTrigger, chart));

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