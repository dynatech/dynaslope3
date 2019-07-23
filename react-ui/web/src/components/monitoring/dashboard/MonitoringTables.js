import React, { Fragment } from "react";
import {
    Grid, Paper, Table, TableHead,
    TableBody, TableRow, TableCell, Typography,
    Divider, Button, ButtonGroup
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

import { makeStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import GeneralStyles from "../../../GeneralStyles";

const styles = theme => ({
    monitoringTable: {
        minWidth: "700px"
    }
});

let id = 0;
function createData (name, calories, fat, carbs, protein) {
    id += 1;
    return { id, name, calories, fat, carbs, protein };
}

const rows = [
    createData("HIN", "08 April 2019 09:30", "08 April 2019 09:30", "R1", "09 April 2019 12:00"),
    createData("LAB", "08 April 2019 09:30", "08 April 2019 09:30", "R1", "09 April 2019 12:00"),
    createData("BAR", "08 April 2019 09:30", "---", "---", "End of Validity"),
    createData("ROUTINE", "08 April 2019 09:30", "---", "---", "---"),
];

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

function MonitoringTables (props) {
    const { candidateAlertsData, alertsFromDbData } = props;
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);

    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const latest_db_alerts = [];
    const { latest, extended, overdue } = alertsFromDbData;
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
                                                    <Typography variant="subtitle1" color="textSecondary">CANDIDATE RELEASE DETAILS</Typography>
                                                    <Grid container spacing={4}>
                                                        <Grid item xs={4}>
                                                            <Typography variant="subtitle2" color="textPrimary">Internal Alert</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{ia_level}</Typography>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Typography variant="subtitle2" color="textPrimary">Data Timestamp</Typography>
                                                            <Typography variant="bod1" color="textPrimary">{ts}</Typography>
                                                        </Grid>
                                                        <Grid item xs={4} />
                                                    </Grid>
                                                </Grid>

                                                <Grid item xs={12}><Divider /></Grid>

                                                <Grid item xs={12}>
                                                    <Typography variant="body1" color="textSecondary">Triggers</Typography>
                                                    <Grid container>
                                                        {
                                                            trigger_arr !== [] ?
                                                                trigger_arr.map((trigger, key) => {
                                                                    const { ts_updated, alert, tech_info } = trigger;
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
                                                                    // const formatted_ts = moment(ts_updated).format("D MMMM YYYY, h:mm");
                                                                    return (
                                                                        <Fragment>
                                                                            <Grid item xs={8}>
                                                                                <Typography variant="body1" color="textPrimary">{trigger_validity} | {alert} | {ts_updated}</Typography>
                                                                                <Typography variant="caption" color="textSecondary">{tech_info}</Typography>
                                                                            </Grid>
                                                                            <Grid item xs={4} align="right">
                                                                                <ButtonGroup variant="contained" color="primary" size="small" aria-label="Alert Actions">
                                                                                    <Button>Invalidate</Button>
                                                                                    <Button>Validate</Button>
                                                                                    <Button>Release</Button>
                                                                                </ButtonGroup>
                                                                            </Grid>
                                                                        </Fragment>
                                                                    );
                                                                })
                                                                : (
                                                                    <Grid item xs={12}>
                                                                        <Typography variant="body1" color="textSecondary">No re/triggers</Typography>
                                                                    </Grid>
                                                                )
                                                        }

                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12} align="right">
                                                    <ButtonGroup variant="contained" color="primary" size="small" aria-label="Alert Actions">
                                                        <Button>Release</Button>
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
                                const event_start_ts = event_start;

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