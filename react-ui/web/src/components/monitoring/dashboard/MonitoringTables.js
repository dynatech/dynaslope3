import React, { Fragment, useState, useEffect } from "react";
import {
    Grid, Typography,
    Divider, Button, ButtonGroup
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { isWidthUp } from "@material-ui/core/withWidth";
import ContentLoader from "react-content-loader";

import moment from "moment";

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import { Publish, Description, PhoneAndroid } from "@material-ui/icons";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import GeneralStyles from "../../../GeneralStyles";
import ValidationModal from "./ValidationModal";
import useModal from "../../reusables/useModal";
import BulletinModal from "../../widgets/bulletin/BulletinModal";
import { getEWIMessage } from "../ajax";
import SendEwiSmsModal from "./SendEwiSmsModal";

const useStyles = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        root: {
            width: "100%",
        },
        sectionHead: {
            ...general_styles.sectionHead,
            marginBottom: 24
        },
        expansionPanelSummaryContent: { justifyContent: "space-between" },
        invalidCandidate: {
            background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)"
        },
        validCandidate: {
            background: "linear-gradient(315deg, #00b712 0%, #5aff15 74%)"
        },
        partialInvalidCandidate: {
            background: "linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%)"
        }
    };
});

function format_ts (ts) {
    return moment(ts).format("DD MMMM YYYY, HH:mm");
}

function release_candidate (site_code, candidate_data) {
    console.log(`Releasing candidate for site ${site_code}`);
    console.log("DATA", candidate_data);
}

function open_validation_modal (site, trigger_id, ts_updated) {
    console.log(site, trigger_id, ts_updated);
    const data = {
        site, trigger_id, ts_updated
    };

    return (
        <ValidationModal data={data} />
    );
}

const MyLoader = () => (
    <ContentLoader 
        height={60}
        width={700}
        speed={0.5}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="-4" y="5" rx="4" ry="4" width="700" height="111" /> 
    </ContentLoader>
);

function CandidateAlertsExpansionPanel (props) {
    const { 
        alertData, classes, expanded,
        handleExpansion, index
    } = props;

    let site = "";
    let ts = "";
    let ia_level = "";
    let trigger_arr = [];
    let has_new_triggers = false;
    const { general_status } = alertData;
    
    if (general_status === "routine") {
        const { data_ts, public_alert_symbol } = alertData;
        site = "ROUTINE RELEASE";
        ts = format_ts(data_ts);
        ia_level = public_alert_symbol;
    } else {
        const { site_code, release_details, internal_alert_level, trigger_list_arr } = alertData;
        const { data_ts } = release_details;
        site = site_code;
        ts = format_ts(data_ts);
        ia_level = internal_alert_level;
        trigger_arr = trigger_list_arr;
        has_new_triggers = trigger_arr !== "No new triggers" && trigger_arr.length > 0;
    }
    site = site.toUpperCase();
    const gen_status = general_status.toUpperCase();

    return (
        <ExpansionPanel
            key={`panel-${index + 1}`}
            expanded={expanded === `panel${index}`}
            onChange={handleExpansion(`panel${index}`)}
        >
            <ExpansionPanelSummary
                // expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}bh-content`}
                id={`panel${index}bh-header`}
                classes={{ content: classes.expansionPanelSummaryContent }}
            >
                {
                    [site, ia_level, ts, gen_status].map((elem, i) => (
                        <Typography
                            key={`candidate-column-${i + 1}`}
                            color="textSecondary"
                            variant="body2"
                        >
                            {elem}
                        </Typography>
                    ))
                }
            </ExpansionPanelSummary>
            <Divider style={{ marginBottom: 12 }} />
            <ExpansionPanelDetails>
                <Grid container spacing={1}>
                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Data Timestamp:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{ts}</Typography>
                        </Grid>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Internal Alert:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{ia_level}</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>

                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textPrimary">TRIGGERS</Typography>
                        </Grid>
                        
                        <Grid item xs={12} container spacing={2} alignItems="center">
                            {
                                has_new_triggers ? (
                                    trigger_arr.map((trigger, key) => {
                                        const { 
                                            ts_updated, alert, tech_info,
                                            trigger_id, trigger_type
                                        } = trigger;
                                        const formatted_ts = format_ts(ts_updated);
                                        let trigger_validity = "Valid";
                                        let to_validate = false;

                                        try {
                                            const { validating_status } = trigger;
                                            if (validating_status === 0) {
                                                trigger_validity = "---";
                                                to_validate = true;
                                            }
                                        } catch (err) { /* pass */ }

                                        try {
                                            const { invalid } = trigger;
                                            if (invalid) {
                                                trigger_validity = "Invalid";
                                            }
                                        } catch (err) { /* pass */ }

                                        const as_details = {
                                            site, trigger_id, ts_updated
                                        };

                                        const to_show_validate_button = ["surficial", "rainfall", "subsurface"].includes(trigger_type) && to_validate;

                                        return (
                                            <Fragment key={`trigger-${index + 1}`}>
                                                <Grid item xs align="center">
                                                    <Typography variant="body1" color="textSecondary">Trigger</Typography>
                                                    <Typography variant="body1" color="textPrimary">{alert}</Typography>
                                                </Grid>

                                                <Grid item xs={4} align="center">
                                                    <Typography variant="body1" color="textSecondary">Trigger timestamp</Typography>
                                                    <Typography variant="body1" color="textPrimary">{formatted_ts}</Typography>
                                                </Grid>

                                                {/* 
                                                    NOTE: Pwedeng ipakita, pwedeng hindi, commented out just in case need
                                                    <Grid item xs={6} align="center">
                                                        <Typography variant="body1" color="textSecondary">Tech Info</Typography>
                                                        <Typography variant="body1" color="textPrimary">{tech_info}</Typography>
                                                    </Grid> 
                                                */}

                                                <Grid item xs align={to_show_validate_button ? "flex-start" : "center"}>
                                                    <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Status:</Typography>
                                                    <Typography component="span" variant="body1" color="textPrimary">{trigger_validity}</Typography>
                                                </Grid>

                                                {
                                                    to_show_validate_button && (
                                                        <Grid item xs justify="flex-end" container>
                                                            <Button
                                                                // onClick={toggle}
                                                                variant="contained" color="secondary"
                                                                size="small" aria-label="Validate trigger"
                                                            >
                                                                Validate
                                                            </Button>
                                                        </Grid>
                                                    )
                                                }

                                                {/* <ValidationModal
                                                            isShowing={isShowing}
                                                            data={as_details}
                                                            hide={toggle}
                                                        /> */}
                                                {
                                                    trigger_arr.length > key + 1 && (
                                                        <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>
                                                    )
                                                }
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <Fragment>
                                        <Grid item xs={12}>
                                            <Typography variant="body1" color="textSecondary">No new triggers</Typography>
                                        </Grid>
                                    </Fragment>
                                )
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    color="secondary" size="small"
                    aria-label="Release candidate alert"
                    startIcon={<Publish />}
                    // onClick={handleOnClick(row)}
                >
                            Release
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function LatestSiteAlertsExpansionPanel (props) {
    const { 
        siteAlert, classes, expanded,
        handleExpansion, index, handleSMSRelease,
        bulletinHandler
    } = props;
    const {
        event, internal_alert_level, releases
    } = siteAlert;

    const { validity, site, event_start } = event;
    const { site_code, site_id } = site;
    const site_name = site_code.toUpperCase();
    
    const start_ts = format_ts(event_start);
    const validity_ts = format_ts(validity);

    const { release_id, data_ts, release_time } = releases[0];

    const is_onset = releases.length === 1;
    let adjusted_data_ts = data_ts;
    if (!is_onset) adjusted_data_ts = moment(data_ts).add(30, "minutes");
    adjusted_data_ts = format_ts(adjusted_data_ts);

    return (
        <ExpansionPanel expanded={expanded === `lsa-panel${index}`} onChange={handleExpansion(`lsa-panel${index}`)}>
            <ExpansionPanelSummary
                // expandIcon={<ExpandMoreIcon />}
                aria-controls={`lsa-panel${index}bh-content`}
                id={`lsa-panel${index}bh-header`}
                classes={{ content: classes.expansionPanelSummaryContent }}
            >
                {
                    [site_name, internal_alert_level, adjusted_data_ts, release_time].map((elem, i) => (
                        <Typography
                            key={`exp-columns-${i + 1}`}
                            color="textSecondary"
                            variant="body2"
                        >
                            {elem}
                        </Typography>
                    ))
                }
            </ExpansionPanelSummary>
            <Divider style={{ marginBottom: 12 }} />
            <ExpansionPanelDetails>
                <Grid container spacing={1}>
                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Event Start:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{start_ts}</Typography>
                        </Grid>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Event Validity:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{validity_ts}</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textPrimary">LATEST RELEASE</Typography>
                    </Grid>
                        
                    <Grid item xs={12} container spacing={1}>
                        {
                            [
                                ["Internal Alert", internal_alert_level],
                                ["Data Timestamp", format_ts(data_ts)],
                                ["Release Time", release_time]
                            ].map((row, key) => (
                                <Grid key={row[0]} item xs align="center">
                                    <Typography variant="body1" color="textSecondary">{row[0]}</Typography>
                                    <Typography variant="body1" color="textPrimary">{row[1]}</Typography>
                                </Grid>
                            ))
                        }
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    size="small" color="primary" 
                    startIcon={<PhoneAndroid />}
                    onClick={() => handleSMSRelease(release_id)}
                >
                    EWI SMS
                </Button>
                <Button 
                    size="small" color="primary"
                    startIcon={<Description />}
                    onClick={bulletinHandler({ release_id, site_code, site_id })}
                >
                        Bulletin
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function MonitoringTables (props) {
    const {
        candidateAlertsData, alertsFromDbData, width,
        releaseFormOpenHandler, chosenCandidateHandler
    } = props;

    const classes = useStyles();
    const [expanded, setExpanded] = useState(false);
    const { isShowing: isModalShowing, toggle: toggleModal } = useModal();
    const { isShowing: isShowingSendEWI, toggle: toggleSendEWI } = useModal();
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);
    
    const handleExpansion = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleOnClick = chosen_candidate => () => {
        console.log(chosen_candidate);
        chosenCandidateHandler(chosen_candidate);
        releaseFormOpenHandler();
    };

    const [ewi_message, setEWIMessage] = useState("");
    const handleSMSRelease = release_id => {
        getEWIMessage(release_id, data => {
            setEWIMessage(data);
            toggleSendEWI();
        });
    };

    const bulletinHandler = release => event => {
        setChosenReleaseDetail(release);
        setIsOpenBulletinModal(true);
    };

    const is_desktop = isWidthUp("md", width);

    let latest_db_alerts = [];
    let extended_db_alerts = [];
    let overdue_db_alerts = [];
    if (alertsFromDbData !== null) {
        const { latest, extended, overdue } = alertsFromDbData;
        latest_db_alerts = latest;
        extended_db_alerts = extended;
        overdue_db_alerts = overdue;
    }
    
    const as_details = {};

    return (
        <div className={classes.root}>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Candidate Alerts</Typography>
                </Grid>

                <Grid item sm={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        candidateAlertsData === null ? (
                            <MyLoader />
                        ) : (
                            candidateAlertsData.length !== 0 ? (
                                candidateAlertsData.map((row, index) => (
                                    <CandidateAlertsExpansionPanel
                                        key={`exp-${index + 1}`}
                                        classes={classes}
                                        alertData={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No candidate alerts
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Latest Site Alerts</Typography>
                </Grid>

                <Grid item sm={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            latest_db_alerts.length > 0 ? (
                                latest_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`latest-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        handleSMSRelease={handleSMSRelease}
                                        index={index}
                                        bulletinHandler={bulletinHandler}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No active alerts on database
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Sites under Extended Monitoring</Typography>
                </Grid>

                <Grid item sm={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            extended_db_alerts.length > 0 ? (
                                extended_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`db-alert-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        handleSMSRelease={handleSMSRelease}
                                        index={index}
                                        bulletinHandler={bulletinHandler}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No sites under extended monitoring
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Sites with Due Alerts</Typography>
                </Grid>

                <Grid item sm={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            overdue_db_alerts.length > 0 ? (
                                overdue_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`overdue-alert-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        handleSMSRelease={handleSMSRelease}
                                        index={index}
                                        bulletinHandler={bulletinHandler}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No sites under overdue alerts
                                </Typography>
                            )
                        )
                    }
                </Grid>


                <BulletinModal 
                    classes={classes}
                    isOpenBulletinModal={isOpenBulletinModal}
                    setIsOpenBulletinModal={setIsOpenBulletinModal}
                    releaseDetail={chosenReleaseDetail}
                />                
            </Grid>

            <SendEwiSmsModal
                modalStateHandler={toggleSendEWI} 
                modalState={isShowingSendEWI}
                textboxValue={ewi_message}
            />
        </div>
    );
}

export default MonitoringTables;