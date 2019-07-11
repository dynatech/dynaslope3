import React, { Component, Fragment } from "react";
import { Grid, withStyles, Button, withWidth, Paper } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, DateTimePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import DetailedExpansionPanels from "./DetailedExpansionPanels";

const styles = theme => ({
    inputGridContainer: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "0 0"
        }
    },
    expansionPanelsGroup: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "24px 0"
        }
    },
    buttonGrid: {
        textAlign: "center",
        [theme.breakpoints.down("sm")]: {
            textAlign: "right"
        }
    },
    button: {
        fontSize: 16,
        paddingLeft: 8
    }
});

function createDateTime ({ label, value, id }, handleDateTime) {
    return (
        <DateTimePicker
            required
            autoOk
            keyboard
            label={label}
            value={value}
            onChange={handleDateTime(id)}
            ampm={false}
            placeholder="2010/01/01 00:00"
            format="YYYY/MM/DD HH:mm"
            mask={[
                /\d/, /\d/, /\d/, /\d/, "/",
                /\d/, /\d/, "/", /\d/, /\d/,
                " ", /\d/, /\d/, ":", /\d/, /\d/
            ]}
            keepCharPositions
            clearable
            disableOpenOnEnter
            disableFuture
            variant="outlined"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}

class MonitoringShiftChe extends Component {
    state = {
        start_ts: null,
        end_ts: null
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    }

    handleDateTime = key => value => {
        this.changeState(key, value);
    }

    render () {
        const { classes, width } = this.props;
        const { start_ts, end_ts } = this.state;

        return (
            <Fragment>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    <Grid 
                        container
                        justify="space-between"
                        alignContent="center"
                        alignItems="center"
                        spacing={16}
                    >
                        {
                            [
                                { label: "Shift Start", value: start_ts, id: "start_ts" },
                                { label: "Shift End", value: end_ts, id: "end_ts" },
                            ].map(row => {
                                const { id } = row;

                                return (
                                    <Grid item xs={12} md={5} key={id} className={classes.inputGridContainer}>
                                        { createDateTime(row, this.handleDateTime) }
                                    </Grid>
                                );
                            })
                        }

                        <Grid
                            item xs={12} md={2}
                            className={`${classes.inputGridContainer} ${classes.buttonGrid}`}
                        >
                            <Button variant="contained" color="secondary" size={isWidthDown("sm", width) ? "small" : "medium"}>
                                Generate <ArrowForwardIos className={classes.button} />
                            </Button>
                        </Grid>
                    </Grid>
                </MuiPickersUtilsProvider>

                <div className={classes.expansionPanelsGroup}>
                    <Paper>
                        <DetailedExpansionPanels/>
                        <DetailedExpansionPanels/>
                        <DetailedExpansionPanels/>
                    </Paper>
                </div>
                
            </Fragment>
        );
    }
}

export default compose(withWidth(), withStyles(styles))(MonitoringShiftChe);
