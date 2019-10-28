import React, { Fragment, useState } from "react";
import {
    Grid, Paper, Table, TableHead,
    TableBody, TableRow, TableCell, Typography,
    Divider, Button, ButtonGroup
} from "@material-ui/core";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import { isWidthUp } from "@material-ui/core/withWidth";

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import GeneralStyles from "../../../GeneralStyles";
import ValidationModal from "./ValidationModal";
import useModal from "../../reusables/useModal";

const styles = theme => ({
    monitoringTable: {
        minWidth: "700px"
    }
});

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: "33.33%",
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    candidateAlertsHeading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: "25.0%",
        flexShrink: 0,
    },
    latestAlertsHeading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: "25.0%",
        flexShrink: 0,
    },
    invalidCandidate: {
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)"
    },
    validCandidate: {
        background: "linear-gradient(315deg, #00b712 0%, #5aff15 74%)"
    },
    partialInvalidCandidate: {
        background: "linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%)"
    }
}));

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

function MonitoringTables (props) {
    const {
        candidateAlertsData, alertsFromDbData, width,
        releaseFormOpenHandler, chosenCandidateHandler
    } = props;
    // console.log("candidateAlertsData", candidateAlertsData);
    // console.log("alertsFromDbData", alertsFromDbData);
    const classes = useStyles();
    const [expanded, setExpanded] = useState(false);
    const { isShowing, toggle } = useModal();
    // const { isShowing: isAlertFormShowing, toggle: alertFromToggle } = useModal();

    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleOnClick = (chosen_candidate) => () => {
        console.log(chosen_candidate);
        chosenCandidateHandler(chosen_candidate);
        releaseFormOpenHandler();
    };

    const is_desktop = isWidthUp("md", width);

    const latest_db_alerts = [];
    const { latest, extended, overdue } = alertsFromDbData;
    let as_details = {};

    // latest_db_alerts = latest;
    return (
        <div className={classes.root}>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Candidate Alerts</Typography>
                </Grid>

                <Grid item sm={12}>
                    {
                        candidateAlertsData !== [] ?
                            candidateAlertsData.map((row, index) => {
                                let site = "";
                                let ts = "";
                                let ia_level = "";
                                let trigger_arr = [];
                                let has_new_triggers = false;
                                const { general_status } = row;
                                if (general_status === "routine") {
                                    const { data_ts, public_alert_symbol } = row;
                                    site = "ROUTINE RELEASE";
                                    ts = data_ts;
                                    ia_level = public_alert_symbol;
                                } else {
                                    const { site_code, release_details, internal_alert_level, trigger_list_arr } = row;
                                    const { data_ts } = release_details;
                                    site = site_code;
                                    ts = data_ts;
                                    ia_level = internal_alert_level;
                                    trigger_arr = trigger_list_arr;
                                    has_new_triggers = trigger_arr !== "No new triggers" && trigger_arr.length > 0;
                                }
                                site = site.toUpperCase();
                                const gen_status = general_status.toUpperCase();


                                return (
                                    <ExpansionPanel expanded={expanded === `panel${index}`} onChange={handleChange(`panel${index}`)}>
                                        <ExpansionPanelSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls={`panel${index}bh-content`}
                                            id={`panel${index}bh-header`}
                                        >
                                            <Typography className={classes.candidateAlertsHeading}>{site}</Typography>
                                            <Typography className={classes.candidateAlertsHeading}>{ia_level}</Typography>
                                            <Typography className={classes.candidateAlertsHeading}>{ts}</Typography>
                                            <Typography className={classes.candidateAlertsHeading}>{gen_status}</Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails>
                                            <Grid container spacing={4}>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" color="textSecondary">{gen_status} CANDIDATE RELEASE DETAILS</Typography>
                                                    <Grid container spacing={4}>
                                                        <Grid item xs={12} sm={4}>
                                                            <Typography variant="subtitle2" color="textPrimary">Internal Alert</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{ia_level}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={4}>
                                                            <Typography variant="subtitle2" color="textPrimary">Data Timestamp</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{ts}</Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>

                                                <Grid item xs={12} sm={12}><Divider /></Grid>

                                                <Grid item xs={12} sm={12}>
                                                    <Typography variant="body1" color="textSecondary">Triggers</Typography>
                                                    <Grid container spacing={2}>
                                                        {
                                                            has_new_triggers
                                                                ?
                                                                trigger_arr.map((trigger, key) => {
                                                                    const { ts_updated, alert, tech_info, trigger_id } = trigger;
                                                                    let trigger_validity = "VALID";
                                                                    try {
                                                                        const { invalid } = trigger;
                                                                        if (invalid) {
                                                                            trigger_validity = "INVALID";
                                                                        }
                                                                    }
                                                                    catch (err) {
                                                                        // PASS
                                                                    }

                                                                    as_details = {
                                                                        site, trigger_id, ts_updated
                                                                    };
                                                                    // const formatted_ts = moment(ts_updated).format("D MMMM YYYY, h:mm");
                                                                    return (
                                                                        <Fragment>
                                                                            <Grid item xs={12} sm={3}>
                                                                                <Typography variant="body1" color="textPrimary">{trigger_validity} | {alert} | {ts_updated}</Typography>
                                                                                <Typography variant="caption" color="textSecondary">{tech_info}</Typography>
                                                                            </Grid>
                                                                            <Grid item xs={12} sm={3} style={{ textAlign: is_desktop ? "center" : "right" }}>
                                                                                <ButtonGroup variant="contained" color="secondary" size="small" aria-label="Alert Actions">
                                                                                    <Button
                                                                                        onClick={toggle}
                                                                                    >
                                                                                        Validate
                                                                                    </Button>
                                                                                    <ValidationModal
                                                                                        isShowing={isShowing}
                                                                                        data={as_details}
                                                                                        hide={toggle}
                                                                                    />
                                                                                </ButtonGroup>
                                                                            </Grid>
                                                                        </Fragment>
                                                                    );
                                                                })
                                                                : <Grid item xs={12}>
                                                                    <Typography variant="body1" color="textSecondary">No re/triggers</Typography>
                                                                </Grid>
                                                        }

                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12} align="right">
                                                    <ButtonGroup variant="contained" color="primary" size="small" aria-label="Alert Actions">
                                                        {/* <Button onClick={(e) => release_candidate(site, row)}>Release Candidate Alert</Button> */}
                                                        <Button
                                                            onClick={handleOnClick(row)}
                                                        >
                                                            Release Candidate Alert
                                                        </Button>
                                                    </ButtonGroup>
                                                </Grid>
                                            </Grid>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                );
                            })
                            : (
                                <Grid container>
                                    <Grid item xs={12}>
                                        No Candidate Alerts
                                    </Grid>
                                </Grid>
                            )
                    }
                </Grid>
                <Grid item sm={12}>
                    <br />
                    <br />
                    <Typography className={classes.sectionHead} variant="h5">Latest Site Alerts</Typography>
                </Grid>
                <Grid item sm={12}>
                    {
                        latest !== [] ?
                            latest.map((row, index) => {
                                const {
                                    event, event_alert_id, internal_alert_level,
                                    public_alert_symbol, releases, ts_end,
                                    ts_start
                                } = row;
                                const { validity, site, event_start } = event;
                                const site_name = site.site_code.toUpperCase();
                                const validity_ts = validity;

                                const { data_ts, release_publishers, triggers } = releases[0];
                                const mt_personnel = `${release_publishers[0].user_details.first_name} ${release_publishers[0].user_details.last_name}`;
                                const ct_personnel = `${release_publishers[1].user_details.first_name} ${release_publishers[1].user_details.last_name}`;
                                const internal_alert = internal_alert_level;

                                return (
                                    <ExpansionPanel expanded={expanded === `lsa-panel${index}`} onChange={handleChange(`lsa-panel${index}`)}>
                                        <ExpansionPanelSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls={`lsa-panel${index}bh-content`}
                                            id={`lsa-panel${index}bh-header`}
                                        >
                                            <Typography className={classes.latestAlertsHeading}>{site_name}</Typography>
                                            <Typography className={classes.latestAlertsHeading}>{internal_alert}</Typography>
                                            <Typography className={classes.latestAlertsHeading}>{validity_ts}</Typography>
                                            <Typography className={classes.latestAlertsHeading}>{data_ts}</Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails>
                                            <Grid container spacing={4}>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" color="textSecondary">LATEST RELEASE DETAILS</Typography>
                                                    <Grid container spacing={4}>
                                                        <Grid item xs={3}>
                                                            <Typography variant="subtitle2" color="textPrimary">Internal Alert Released</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{internal_alert}</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography variant="subtitle2" color="textPrimary">Last Data Timestamp</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{data_ts}</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography variant="subtitle2" color="textPrimary">MT Reporter</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{mt_personnel}</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography variant="subtitle2" color="textPrimary">CT Reporter</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{ct_personnel}</Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>

                                                <Grid item xs={8}>
                                                    <Typography variant="body1" color="textSecondary">Triggers</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        Triggered
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4} align="right">
                                                    <Button variant="contained" color="primary" className={classes.button}>
                                                        Send EWI
                                                    </Button>
                                                    <Button variant="contained" color="secondary" className={classes.backButton}>
                                                        Send Bulletin
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                );
                            })
                            : (
                                <Grid container>
                                    <Grid item xs={12}>
                                        No Alerts from Database
                                    </Grid>
                                </Grid>
                            )
                    }
                </Grid>
            </Grid>

        </div>
    );
}

// export default (MonitoringTables)
export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(MonitoringTables);