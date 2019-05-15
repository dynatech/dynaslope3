import React, { Component, Fragment } from "react";
import { Paper, Table, TableHead,
    TableBody, TableRow, TableCell
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";

const styles = theme => ({
    eventTable: {
        minWidth: "900px"
    }
});

class Container extends Component {
    state = {
        sample: null
    }

    render () {
        const { classes } = this.props;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle title="Alert Monitoring | Events" />
                </div>

                <div className={`${classes.pageContentMargin}`}>
                    <Paper className={classes.paperContainer}>
                        <Table className={classes.eventTable}>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="right">Event ID</TableCell>
                                    <TableCell>Site</TableCell>
                                    <TableCell>Monitoring Type</TableCell>
                                    <TableCell align="right">Start</TableCell>
                                    <TableCell align="right">End</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...Array(50)].map((e, i) => (
                                    <TableRow key={i}>
                                        <TableCell align="right" component="th" scope="row">
                                            123
                                        </TableCell>
                                        <TableCell>PLA (Planas, Guihulngan City, Negros Oriental)</TableCell>
                                        <TableCell>
                                            {
                                                i % 2 === 0 ? "EVENT" : "ROUTINE"
                                            }
                                        </TableCell>
                                        <TableCell align="right">24 January 2019, 11:30 AM</TableCell>
                                        <TableCell align="right">
                                            {
                                                i % 2 === 0 ? "24 January 2019, 11:30 AM" : "-"
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </div>
            </Fragment>
        );
    }
}

export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(Container);
