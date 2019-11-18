import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Timeline, TimelineItem } from "vertical-timeline-component-for-react";
import withWidth from "@material-ui/core/withWidth";
import { Typography, Grid, Button } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { compose } from "recompose";

import GeneralStyles from "../../../GeneralStyles";
import { getEventTimelineEntries } from "../ajax";
import BulletinModal from "../../widgets/bulletin/BulletinModal";


function getReleaseHeader (release_type) {
    let headers = "EWI";
    if (release_type === "end_of_validity") headers = "END OF MONITORING";
    else if (release_type === "overdue") headers = "EWI OVERDUE";
    else if (release_type === "extended") headers = "EXTENDED MONITORING";

    return headers;
}


function getColorBasedOnReleaseType (release_type) {
    let color = "#F8991D";
    if (release_type === "end_of_validity") color = "#00B200";
    else if (release_type === "overdue") color = "#FA4413";
    else if (release_type === "extended") color = "#00B200";

    return color;
}


function buildTimelineElements (timelineItems, bulletinHandler, site_code) {
    const temp = [];
    let key = 0;
    timelineItems.forEach(item => {
        key += 1;
        const {
            item_timestamp, item_data, item_type
        } = item;
        let element = null;

        const moment_item_timestamp = moment(item_timestamp).format("D MMMM YYYY, h:mm A");

        if (item_type === "narrative") {
            element = (
                <TimelineItem
                    // key="001"
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: "#969696" }}
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
                            {moment_item_timestamp}
                        </div>
                    )}                                            
                >
                    {item_data.narrative}
                </TimelineItem>
            );
        } else if (item_type === "release") {
            const {
                release_time, data_ts, release_publishers,
                triggers, release_id
            } = item_data;
            console.log(item_data);
            const { release_type } = item;
            const card_color = getColorBasedOnReleaseType(release_type);
            const header = getReleaseHeader(release_type);
            
            const moment_data_ts = moment(data_ts).format("D MMMM YYYY, h:mm A")
            .toUpperCase();
            
            let mt = "";
            let ct = "";
            release_publishers.forEach(publisher => {
                const { role, user_details } = publisher;
                const { first_name, last_name } = user_details;
                if (role === "mt") mt = `${first_name} ${last_name}`;
                if (role === "ct") ct = `${first_name} ${last_name}`;
            });

            const trigger_info = [];
            if (triggers.length !== 0) {
                triggers.forEach(trigger => {
                    const { info } = trigger;
                    console.log(info);
                    trigger_info.push(info);
                });
            } else {
                console.log("walang trigger");
                trigger_info.push("No triggers");
            }

            element = (
                <TimelineItem
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: card_color }}
                    dateInnerStyle={{ background: card_color }}
                    bodyContainerStyle={{
                        background: "#ddd",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0.5rem 0.5rem 2rem 0 rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12}>
                            <h3 style={{ color: card_color }}>{header} {moment_data_ts}</h3>
                            <h4 style={{ color: card_color }}>Release Time: {release_time}</h4>
                        </Grid>
                        <Grid item xs={12} sm={12}>
                            {
                                trigger_info
                            } 
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            {mt} | {ct}
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <span>
                                <Button
                                    // aria-label="Compose message"
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    // style={{ marginRight: 8 }}
                                    onClick={bulletinHandler({ release_id, site_code, is_onset: false })}
                                >
                                    Bulletin
                                </Button>
                            </span>                                
                        </Grid>
                    </Grid>
                </TimelineItem>
            );
        } else if (item_type === "eos") {
            element = (
                <TimelineItem
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: "#3f51b5" }}
                    dateInnerStyle={{ background: "#3f51b5" }}
                    bodyContainerStyle={{
                        background: "#ddd",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0.5rem 0.5rem 2rem 0 rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <h3 style={{ color: "#3f51b5" }}>END-OF-SHIFT ANALYSIS</h3>
                    <h4>{moment_item_timestamp.toUpperCase()}</h4><br/> 
                    {/* HIGHLY DANGEROUS REACT CODE: */}
                    {/* Might wanna use react-html-parser in the future  */}
                    <div dangerouslySetInnerHTML={{ __html: item_data }} />
                    
                </TimelineItem>
            );
        }

        temp.push(element);
    });
    return temp;
}


function MonitoringEventTimeline (props) {
    const { 
        classes, match: { params: { event_id } } 
    } = props;
    const [eventDetails, setEventDetails] = useState({
        event_id,
        site_code: "",
        site_id: 1,
        validity: "",
        event_start: ""
    });
    const [timelineItems, setTimelineItems] = useState([]);
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);

    useEffect(() => {
        const input = {
            event_id
        };
        getEventTimelineEntries(input, ret => {
            console.log(ret);
            const {
                event_details, timeline_items
            } = ret;
            if (Object.keys(event_details).length > 0) {
                setEventDetails(event_details);
                setTimelineItems(timeline_items);
            }
        });
    }, []);

    const bulletinHandler = release => event => {
        console.log(release);
        setChosenReleaseDetail(release);
        setIsOpenBulletinModal(true);
    };

    return (
        <Fragment>
            <Typography 
                variant="h4" 
                gutterBottom
                align="center"
            >
                Event Monitoring Timeline
            </Typography>
            <hr/>
            <Typography 
                variant="h2" 
                gutterBottom
                align="center"
            >
                {eventDetails.site_code.toUpperCase()}
            </Typography>
            <Typography 
                variant="h6" 
                gutterBottom
                align="center"
            >
                {moment(eventDetails.event_start).format("D MMMM YYYY, h:mm A")} to {moment(eventDetails.validity).format("D MMMM YYYY, h:mm A")}
            </Typography>
            <Timeline lineColor="#ddd">
                {buildTimelineElements(timelineItems, bulletinHandler, eventDetails.site_code)}
            </Timeline>

            <BulletinModal 
                classes={classes}
                isOpenBulletinModal={isOpenBulletinModal}
                setIsOpenBulletinModal={setIsOpenBulletinModal}
                releaseDetail={chosenReleaseDetail}
            />
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
