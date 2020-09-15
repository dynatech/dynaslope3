import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import TodayIcon from "@material-ui/icons/Today";

import moment from "moment";
import { Grid } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    summary: {
        minHeight: 24
    },
    summaryContent: {
        marginBottom: 6,
        marginTop: 6
    },
    icon: {
        paddingTop: 6,
        paddingBottom: 6
    },
    details: { paddingTop: 16 }
}));

// This function returns a component displaying current shift and next 2 shifts
function MonitoringShiftsPanel (props) {
    const { shiftData } = props;
    const classes = useStyles();
    const [shifts, setShifts] = useState([]);

    useEffect(() => {    
        if (shiftData !== null || shiftData !== "undefined") {
            const data = shiftData.filter(row => {
                if (moment(row.ts) > moment().subtract({ hours: 12 })) {
                    return row;
                }
                return null;
            });
            const temp = data.slice(0, 3);
            setShifts(temp);
        }
    }, [shiftData]);

    const getShiftStatus = (ts => {
        const now = moment();
        const shift_start = moment(ts);
        const shift_end = moment(ts).add(12, "hours");

        if (now > shift_start && shift_start <= shift_end)
            return "Current";

        if (now.add(12, "hours") > shift_start)
            return "Next";

        if (now.add(24, "hours") > shift_start)
            return shift_start.format("MMMM D, A (ddd)");

        return null;
    });

    return (
        <ExpansionPanel defaultExpanded={false}>
            <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1c-content"
                id="panel1c-header"
                className={classes.summary}
                IconButtonProps={{ className: classes.icon }}
                classes={{ content: classes.summaryContent }}
            >
                <Grid container justify="space-between" alignItems="baseline">
                    <Grid item xs>
                        <Typography variant="caption">
                            <strong>MONITORING SHIFT</strong>
                        </Typography>
                    </Grid>

                    {
                        shifts.length > 0 && (
                            <Grid 
                                item xs container
                                justify="space-evenly"
                            >
                                <Typography variant="overline">
                                    MT - {shifts[0].iompmt}
                                </Typography>

                                <Typography variant="overline">
                                    CT - {shifts[0].iompct}
                                </Typography>
                            </Grid>
                        )
                    }
                </Grid>
            </ExpansionPanelSummary>
            <Divider />
            <ExpansionPanelDetails>
                <Grid container justify="space-evenly" className={classes.details}>
                    {
                        shifts.length > 0 && shifts.map(row => (
                            <Grid item xs={6} sm={4} key={row.ts}>
                                <Typography variant="subtitle2" align="center">
                                    <strong>{getShiftStatus(row.ts)}</strong>
                                </Typography>
                                <Typography variant="body2" align="center">        
                                    {row.iompmt} (MT)
                                </Typography>
                                <Typography variant="body2" align="center" gutterBottom>        
                                    {row.iompct} (CT)
                                </Typography>
                            </Grid>
                        ))
                    } 
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Link to="monitoring/shifts_and_reports/shifts" style={{ textDecoration: "none" }}>
                    <Button size="small" color="primary" startIcon={<TodayIcon />}>
                        Go to Calendar
                    </Button>
                </Link>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

export default MonitoringShiftsPanel;
