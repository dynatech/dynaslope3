import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Timeline, TimelineItem } from "vertical-timeline-component-for-react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { CircularProgress, Typography, Paper } from "@material-ui/core";
import { withStyles, createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { compose } from "recompose";

import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import { getEventTimelineEntries } from "../ajax";


function buildTimelineElements (timelineItems) {
    const temp = [];
    let key = 0;
    timelineItems.forEach(item => {
        key += 1;
        const {
            item_timestamp, item_data, item_type
        } = item;
        let element = null;

        switch (item_type) {
            case "narrative":
                element = (
                    <TimelineItem
                        // key="001"
                        key={key}
                        dateText={item_timestamp}
                        style={{ color: "#e86971" }}
                        dateComponent={(
                            <div
                                style={{
                                    display: "block",
                                    "float": "left",
                                    padding: "10px",
                                    background: "rgb(150, 150, 150)",
                                    color: "#fff",
                                }}
                            >
                                {item_timestamp}
                            </div>
                        )}                                            
                    >
                        <p>
                            {item_data.narrative}
                        </p>
                    </TimelineItem>
                );
                
                break;
            case "release":
                const {
                    release_time, data_ts
                } = item_data;
                element = (
                    <TimelineItem
                        key={key}
                        dateText={item_timestamp}
                        style={{ color: "#e86971" }}
                        bodyContainerStyle={{
                            background: "#ddd",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0.5rem 0.5rem 2rem 0 rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <h3 style={{ color: "#e86971" }}>EWI {data_ts}</h3>
                        <h4 style={{ color: "#e86971" }}>Release Time: {release_time}</h4>
                        <p>
                            [TRIGGERS GOES HERE] 
                            or 
                            NO TRIGGERS
                        </p>
                    </TimelineItem>
                );
                break;
            case "eos":
                console.log(item_data);
                element = (
                    <TimelineItem
                        key={key}
                        dateText={item_timestamp}
                        dateInnerStyle={{ background: "#76bb7f" }}
                        bodyContainerStyle={{
                            background: "#ddd",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0.5rem 0.5rem 2rem 0 rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <h3 style={{ color: "#76bb7f" }}>EOS {data_ts}</h3>
                        <p>{item_data}</p>
                    </TimelineItem>
                );                
                break;
            default:
                break;
        }

        temp.push(element);
    });
    return temp;
}


function MonitoringEventTimeline (props) {
    const { classes, width, 
        match: { url, params: { event_id } } 
    } = props;
    const [eventDetails, setEventDetails] = useState({});
    const [timelineItems, setTimelineItems] = useState([]);

    useEffect(() => {
        const input = {
            event_id
        };
        getEventTimelineEntries(input, ret => {
            const {
                event_details, timeline_items
            } = ret;
            setEventDetails(event_details);
            setTimelineItems(timeline_items);
            console.log("event_details", event_details);
            console.log("timeline_items", timeline_items);
        });
    }, []);

    return (
        <Fragment>
            Hello World! Link provided is: {event_id}. URL is: {url}.
            Event Monitoring Timeline
            <Timeline lineColor="#ddd">
                {buildTimelineElements(timelineItems)}
            </Timeline>            
        </Fragment>
    );
}

export default compose(
    withStyles(
        (theme) => ({
            ...GeneralStyles(theme),
            // ...styles(theme),
        }),
        { withTheme: true },
    ), withWidth()
)(MonitoringEventTimeline);
