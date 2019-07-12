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
function createData(name, calories, fat, carbs, protein) {
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
    latestAlertsHeading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: "25.0%",
        flexShrink: 0,
    },
}));

function MonitoringTables(props) {
    const { candidateAlertsData, alertsFromDbData } = props;
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);

    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    let latest_db_alerts = [];
    console.log(alertsFromDbData);
    const { latest, extended, overdue } = alertsFromDbData;
    latest_db_alerts = latest;
    console.log(latest);
    return (
        <div className={classes.root}>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item sm={12}>
                    <Typography className={classes.sectionHead} variant="h5">Candidate Alerts</Typography>
                </Grid>

                <Grid item sm={12}>
                    {
                        candidateAlertsData != [] ?
                            candidateAlertsData.map((row, index) => {
                                let site = "";
                                let ts = "";
                                let ia_level = "";
                                const { general_status } = row;
                                if (general_status === "routine") {
                                    const { data_ts, public_alert_symbol } = row;
                                    site = "ROUTINE RELEASE";
                                    ts = data_ts;
                                    ia_level = public_alert_symbol;
                                } else {
                                    const { site_code, release_details, internal_alert_level } = row;
                                    const { data_ts } = release_details;
                                    site = site_code;
                                    ts = data_ts;
                                    ia_level = internal_alert_level;
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
                                            <Typography className={classes.heading}>{site}</Typography>
                                            <Typography className={classes.heading}>{ts}</Typography>
                                            <Typography className={classes.heading}>{gen_status}</Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails>
                                            <Grid container spacing={8}>
                                                <Grid item xs={4}>
                                                    <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        {ia_level}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body1" color="textSecondary">Latest Trigger Timestamp</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        {"row.trigger_list_arr[0].ts_updated"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4} />

                                                <Grid item xs={8}>
                                                    <Typography variant="body1" color="textSecondary">Triggers</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        Triggered
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4} align="right">
                                                    <ButtonGroup variant="contained" color="primary" size="small" aria-label="Alert Actions">
                                                        <Button>Invalidate</Button>
                                                        <Button>Validate</Button>
                                                        <Button>Release</Button>
                                                    </ButtonGroup>
                                                </Grid>
                                            </Grid>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                );
                            })
                            : (
                                <Fragment>No Candidate Alerts</Fragment>
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
                        latest_db_alerts !== [] ?
                            latest_db_alerts.map((row, index) => {
                                const {
                                    event, event_alert_id, internal_alert_level,
                                    public_alert_symbol, releases, ts_end,
                                    ts_start
                                } = row;
                                const { validity, site, event_start } = event;
                                const site_name = site.site_code.toUpperCase();
                                const validity_ts = validity;
                                const event_start_ts = event_start;

                                const { data_ts } = releases[0];
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
                                            <Grid container spacing={8}>
                                                <Grid item xs={4}>
                                                    <Typography variant="body1" color="textSecondary">Latest Release</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        {"row.carbs"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body1" color="textSecondary">Latest Trigger Timestamp</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        {row.fat}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4} />

                                                <Grid item xs={12}>
                                                    <Typography variant="body1" color="textSecondary">Triggers</Typography>
                                                    <Typography variant="body1" color="textPrimary">
                                                        Triggered
                                                    </Typography>
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
                                <Fragment>
                                    No existing alerts on database
                                </Fragment>
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