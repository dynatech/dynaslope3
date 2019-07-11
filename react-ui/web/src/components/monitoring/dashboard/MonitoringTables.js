import React, { Fragment } from "react";
import {
    Grid, Paper, Table, TableHead,
    TableBody, TableRow, TableCell, Typography,
    Divider, Button, ButtonGroup
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import GeneralStyles from "../../../GeneralStyles";

import { makeStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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
        width: '100%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: '33.33%',
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
}));

function MonitoringTables(props) {
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);

    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <div className={classes.root}>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item sm>
                    <Typography className={classes.sectionHead} variant="h5">Candidate Alerts</Typography>
                </Grid>

                <Grid item sm>
                    {/* <Fab color="primary" aria-label="Add" size="small">
                        <AddIcon />
                    </Fab> */}
                </Grid>
            </Grid>
            {
                rows.map((row, index) => (
                    <ExpansionPanel expanded={expanded === `panel${index}`} onChange={handleChange(`panel${index}`)}>
                        <ExpansionPanelSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`panel${index}bh-content`}
                            id={`panel${index}bh-header`}
                        >
                            <Typography className={classes.heading}>{row.name}</Typography>
                            <Typography className={classes.heading}>{row.calories}</Typography>
                            <Typography className={classes.heading}>{row.protein}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={8}>
                                <Grid item xs={4}>
                                    <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                                    <Typography variant="body1" color="textPrimary">
                                        {row.carbs}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body1" color="textSecondary">Latest Trigger Timestamp</Typography>
                                    <Typography variant="body1" color="textPrimary">
                                        {row.fat}
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
                ))
            }
            <br />
            <br />
            <div className={classes.sectionHeadContainer}>
                <Typography className={classes.sectionHead} variant="h5">Latest Site Alerts</Typography>
            </div>
            {
                rows.map((row, index) => (
                    <ExpansionPanel expanded={expanded === `lsa-panel${index}`} onChange={handleChange(`lsa-panel${index}`)}>
                        <ExpansionPanelSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`lsa-panel${index}bh-content`}
                            id={`lsa-panel${index}bh-header`}
                        >
                            <Typography className={classes.heading}>{row.name}</Typography>
                            <Typography className={classes.heading}>{row.calories}</Typography>
                            <Typography className={classes.heading}>{row.protein}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={8}>
                                <Grid item xs={4}>
                                    <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                                    <Typography variant="body1" color="textPrimary">
                                        {row.carbs}
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
                ))
            }
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