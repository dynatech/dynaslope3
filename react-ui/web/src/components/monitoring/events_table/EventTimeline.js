import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Timeline, TimelineItem } from "vertical-timeline-component-for-react";
import {
    Typography, Grid, Button,
    Divider, makeStyles, Icon
} from "@material-ui/core";

import { Description, Assessment } from "@material-ui/icons";
import { getEventTimelineEntries } from "../ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";
import BulletinModal from "../../widgets/bulletin/BulletinModal";

const useStyles = makeStyles(theme => ({
    timeline: {
        margin: "0 auto",
        lineColor: "#DDDDDD",
        paddingTop: 24
    }
}));

function processTriggers (triggers) {
    const ReturnDiv = <ul>
        {
            triggers.map(trigger => {
                const {
                    ts, info, internal_sym: { 
                        trigger_symbol: {
                            alert_symbol,
                            trigger_hierarchy: { trigger_source }
                        },
                        alert_symbol: int_alert_sym
                    }, trigger_id
                } = trigger;
            
                const source = trigger_source === "moms" ? "Manifestation of Movement"
                    : capitalizeFirstLetter(trigger_source);
            
                const main = <li>{
                    `${source} (${alert_symbol}) alert triggered on ${moment(ts).format("MMMM Do YYYY, hh:mm A")}`
                }</li>;
                const tech_info = <ul><li>{info}</li></ul>;

                const additional = [];
                if (trigger_source === "moms") {
                    const { trigger_misc: { moms_releases } } = trigger;

                    moms_releases.forEach(moms_entry => {
                        const entry = processMomsTrigger(moms_entry, int_alert_sym);
                        additional.push(entry);
                    });
                }

                return <Fragment key={trigger_id}>
                    {main}{tech_info}
                    {additional.map(row => row)}
                </Fragment>;
            })
        }
    </ul>;

    return ReturnDiv;
}

function processMomsTrigger (moms_entry, int_alert_sym, non_triggering = false) {
    const {
        moms_details: { 
            moms_instance: {
                feature: { feature_type },
                feature_name
            },
            op_trigger,
            validator: { first_name: vfn, last_name: vln },
            reporter: { first_name: rfn, last_name: rln },
            narrative: { narrative },
            remarks, moms_id
        }
    } = moms_entry;

    const prefix = non_triggering ? "Non-triggering " : "";

    const feature_set = <ul key={moms_id}>
        <li>
            {prefix}Feature: {capitalizeFirstLetter(feature_type)} {feature_name} ({int_alert_sym + op_trigger})
        </li>
        <ul>
            <li>Narrative: {narrative}</li>
            <li>Reporter: {`${rfn} ${rln}`}</li>
            <li>Remarks: {remarks}</li>
            <li>Validator: {`${vfn} ${vln}`}</li>
        </ul>
    </ul>;
    
    return feature_set;
}

function getReleaseHeader (release_type) {
    let headers = "EARLY WARNING INFORMATION";
    if (release_type === "end_of_validity") headers = "END OF MONITORING";
    else if (release_type === "overdue") headers = "OVERDUE";
    else if (release_type === "extended") headers = "EXTENDED MONITORING";
    else if (release_type === "routine") headers = "ROUTINE MONITORING";

    return headers;
}

function getColorBasedOnReleaseType (release_type) {
    let color = "#F8991D";
    if (release_type === "end_of_validity") color = "#00B200";
    else if (release_type === "overdue") color = "#FA4413";
    else if (release_type === "extended") color = "#00B200";
    else if (release_type === "routine") color = "#59081E";

    return color;
}


function buildTimelineElements (timelineItems, bulletinHandler, site_code, site_id) {
    const temp = [];
    let key = 0;
    timelineItems.forEach(item => {
        key += 1;
        const {
            item_timestamp, item_data, item_type
        } = item;
        let element = null;

        const moment_item_timestamp = moment(item_timestamp).format("DD MMMM YYYY, hh:mm A");

        if (item_type === "narrative") {
            element = (
                <TimelineItem
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: "#969696" }}
                    dateComponent={(
                        <div
                            style={{
                                display: "block",
                                "float": "right",
                                padding: "10px",
                                marginRight: 38,
                                background: "rgb(150, 150, 150)",
                                color: "#fff",
                            }}
                        >
                            {moment_item_timestamp}
                        </div>
                    )}                                            
                >
                    <Typography variant="body2" component="div">
                        {item_data.narrative}
                    </Typography>
                </TimelineItem>
            );
        } else if (item_type === "release") {
            const {
                release_time, data_ts, release_publishers,
                triggers, is_onset, internal_alert_level,
                moms_releases, release_id
            } = item_data;

            const { release_type } = item;
            const card_color = getColorBasedOnReleaseType(release_type);
            const header = getReleaseHeader(release_type);
            
            let moment_data_ts = moment(data_ts);
            if (!is_onset) moment_data_ts = moment_data_ts.add(30, "minutes");
            moment_data_ts = moment_data_ts.format("MMMM Do YYYY, h:mm A");
            
            let mt = "";
            let ct = "";
            release_publishers.forEach(publisher => {
                const { role, user_details } = publisher;
                const { first_name, last_name } = user_details;
                if (role === "mt") mt = `${first_name} ${last_name}`;
                if (role === "ct") ct = `${first_name} ${last_name}`;
            });

            element = (
                <TimelineItem
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: card_color }}
                    dateInnerStyle={{ background: card_color, lineHeight: "48px", textAlign: "center" }}
                    bodyContainerStyle={{
                        background: "#EEEEEE",
                        padding: "18px 20px",
                        borderRadius: "8px",
                        boxShadow: "0.2rem 0.2rem 0.5rem 0 rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <Grid container spacing={1}>
                        <Grid item xs={12} container alignItems="center">
                            <Icon style={{ color: card_color, height: 45, width: "auto", paddingRight: 8 }}>
                                <Description style={{ height: 45, width: "auto" }} />
                            </Icon>
                            <div>
                                <Typography
                                    variant="caption" component="div"
                                    style={{ color: card_color }}
                                >
                                    <strong>{header}</strong>
                                </Typography>
                                <Typography
                                    variant="h6" component="div"
                                    style={{ color: card_color, lineHeight: 1.2 }}
                                >
                                    <strong>{moment_data_ts}</strong>
                                </Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12} container justify="space-between">
                            <Typography variant="body2" style={{ color: card_color }}>
                                Release Time: <strong>{release_time}</strong>
                            </Typography>
                            <Typography variant="body2" style={{ color: card_color }}>
                                Internal Alert Level: <strong>{internal_alert_level}</strong>
                            </Typography>
                        </Grid>
                        {
                            triggers.length > 0 && (
                                <Fragment>
                                    <Grid item xs={12}><Divider /></Grid>
                                    <Grid item xs={12}>
                                        <Typography 
                                            variant="body2"
                                            component="div"
                                            style={{ color: card_color }}
                                        >
                                            <strong>{processTriggers(triggers)}</strong>
                                        </Typography>
                                    </Grid>
                                </Fragment>
                            )
                        }

                        {
                            moms_releases.length > 0 && (
                                <Fragment>
                                    <Grid item xs={12}><Divider /></Grid>
                                    <Grid item xs={12}>
                                        <Typography 
                                            variant="body2"
                                            component="div"
                                            style={{ color: card_color }}
                                        >
                                            <strong>
                                                {
                                                    moms_releases.map(row => processMomsTrigger(row, "m", true))
                                                }
                                            </strong>
                                        </Typography>
                                    </Grid>
                                </Fragment>
                            )
                        }
                        
                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12} container justify="space-between" alignItems="center">
                            <Typography variant="body2" style={{ color: card_color }}>
                                {mt} | {ct}
                            </Typography>
                            <Button
                                aria-label="Show bulletin"
                                variant="text"
                                color="primary"
                                size="small"
                                onClick={bulletinHandler({ release_id, site_code, site_id })}
                            >
                                Bulletin
                            </Button>
                        </Grid>
                    </Grid>
                </TimelineItem>
            );
        } else if (item_type === "eos") {
            const card_color = "#3f51b5";
            element = (
                <TimelineItem
                    key={key}
                    dateText={moment_item_timestamp}
                    style={{ color: card_color }}
                    dateInnerStyle={{ background: card_color, lineHeight: "48px" }}
                    bodyContainerStyle={{
                        background: "#EEEEEE",
                        padding: "18px 20px",
                        borderRadius: "8px",
                        boxShadow: "0.2rem 0.2rem 0.5rem 0 rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <Grid container spacing={1}>
                        <Grid item xs={12} container alignItems="center">
                            <Icon style={{ color: card_color, height: 45, width: "auto", paddingRight: 8 }}>
                                <Assessment style={{ height: 45, width: "auto" }} />
                            </Icon>
                            <div>
                                <Typography
                                    variant="caption" component="div"
                                    style={{ color: card_color }}
                                >
                                    <strong>END-OF-SHIFT-ANALYSIS</strong>
                                </Typography>
                                <Typography
                                    variant="h6" component="div"
                                    style={{ color: card_color, lineHeight: 1.2 }}
                                >
                                    <strong>{moment(item_timestamp).format("MMMM Do YYYY, h:mm A")}</strong>
                                </Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12}>
                            <Typography
                                variant="body2"
                                style={{ color: card_color }}
                                dangerouslySetInnerHTML={{ __html: item_data }}
                            />
                        </Grid>
                    </Grid>
                    {/* <h3 style={{ color: card_color }}>END-OF-SHIFT ANALYSIS</h3> */}
                    {/* <h4>{moment_item_timestamp.toUpperCase()}</h4><br/> */}
                    {/* HIGHLY DANGEROUS REACT CODE: */}
                    {/* Might wanna use react-html-parser in the future  */}
                    {/* <div dangerouslySetInnerHTML={{ __html: item_data }} /> */}
                </TimelineItem>
            );
        }

        temp.push(element);
    });
    return temp;
}

function MonitoringEventTimeline (props) {
    const { match: { params: { event_id } } } = props;
    const classes = useStyles();
    const [eventDetails, setEventDetails] = useState({
        event_id,
        site_code: "---",
        site_id: 1,
        validity: moment(),
        event_start: moment(),
        site_address: "",
        status: 1
    });
    const [timelineItems, setTimelineItems] = useState([]);
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);

    useEffect(() => {
        const input = { event_id };
        getEventTimelineEntries(input, ret => {
            const {
                event_details, timeline_items
            } = ret;
            if (Object.keys(event_details).length > 0) {
                setEventDetails(event_details);
                setTimelineItems(timeline_items);
            }
        });
    }, []);

    const monitoring_type = eventDetails.status === 1 ? "ROUTINE" : "EVENT";
    const bulletinHandler = release => event => {
        console.log(release);
        setChosenReleaseDetail(release);
        setIsOpenBulletinModal(true);
    };

    const format_str = "MMMM Do YYYY, hh:mm A";
    const start_ts = moment(eventDetails.event_start).format(format_str);
    const end_ts = moment(eventDetails.validity).format(format_str);

    return (
        <Grid container spacing={2}>
            {/* <Grid item xs={12} align="center">
                <Typography variant="h5">
                    {monitoring_type} Monitoring Timeline
                </Typography>
            </Grid> */}
            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    <strong>{monitoring_type} MONITORING TIMELINE</strong>
                </Typography>
                <Typography 
                    variant="h4"
                    align="center"
                >
                    {eventDetails.site_address} ({eventDetails.site_code.toUpperCase()})
                </Typography>
                <Typography 
                    variant="subtitle1"
                    align="center"
                >
                    {start_ts} to {end_ts}
                </Typography>
            </Grid>

            <Timeline className={classes.timeline} lineColor="#DDDDDD">
                {
                    buildTimelineElements(timelineItems, bulletinHandler, eventDetails.site_code, eventDetails.site_id)
                }
            </Timeline>

            <BulletinModal 
                classes={classes}
                isOpenBulletinModal={isOpenBulletinModal}
                setIsOpenBulletinModal={setIsOpenBulletinModal}
                releaseDetail={chosenReleaseDetail}
            />     
        </Grid>
    );
}

export default MonitoringEventTimeline;
