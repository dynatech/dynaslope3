import React, { Fragment } from "react";
import {
    Grid, Paper, Table, TableHead,
    TableBody, TableRow, TableCell, Typography
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
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
  
function MonitoringTables (props) {
    const { classes } = props;
  
    return (
        <Fragment>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item sm>
                    <Typography className={classes.sectionHead} variant="headline">Candidate Alerts</Typography>
                </Grid>

                <Grid item sm>
                    {/* <Fab color="primary" aria-label="Add" size="small">
                        <AddIcon />
                    </Fab> */}
                </Grid>
            </Grid>

            <Paper className={classes.paperContainer}>
                <Table className={classes.monitoringTable}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Site Code</TableCell>
                            <TableCell align="right">Data Timestamp</TableCell>
                            <TableCell align="right">Latest Trigger Timestamp</TableCell>
                            <TableCell>Trigger Type</TableCell>
                            <TableCell align="right">Validity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">{row.calories}</TableCell>
                                <TableCell align="right">{row.fat}</TableCell>
                                <TableCell>{row.carbs}</TableCell>
                                <TableCell align="right">{row.protein}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            
            <div className={classes.sectionHeadContainer}>
                <Typography className={classes.sectionHead} variant="headline">Latest Site Alerts</Typography>
            </div>

            <Paper className={classes.paperContainer}>
                <Table className={classes.monitoringTable}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Site Code</TableCell>
                            <TableCell align="right">Data Timestamp</TableCell>
                            <TableCell align="right">Latest Trigger Timestamp</TableCell>
                            <TableCell>Trigger Type</TableCell>
                            <TableCell align="right">Validity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">{row.calories}</TableCell>
                                <TableCell align="right">{row.fat}</TableCell>
                                <TableCell>{row.carbs}</TableCell>
                                <TableCell align="right">{row.protein}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <div className={classes.sectionHeadContainer}>
                <Typography className={classes.sectionHead} variant="headline">Sites Under Extended Monitoring</Typography>
            </div>

            <Paper className={classes.paperContainer}>
                <Table className={classes.monitoringTable}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Site Code</TableCell>
                            <TableCell align="right">Data Timestamp</TableCell>
                            <TableCell align="right">Latest Trigger Timestamp</TableCell>
                            <TableCell>Trigger Type</TableCell>
                            <TableCell align="right">Validity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">{row.calories}</TableCell>
                                <TableCell align="right">{row.fat}</TableCell>
                                <TableCell>{row.carbs}</TableCell>
                                <TableCell align="right">{row.protein}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Fragment>
    );
}

export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(MonitoringTables);