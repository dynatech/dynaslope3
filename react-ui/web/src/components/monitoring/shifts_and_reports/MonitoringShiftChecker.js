import React, { Component, Fragment } from "react";
import { Grid, withStyles, Button, withWidth, Paper } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, DateTimePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import OutlinedSelectInputForm from "../../reusables/OutlinedSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";

const styles = theme => ({
    inputGridContainer: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "0 0"
        }
    },
    selects: {
        width: "auto",
        [theme.breakpoints.up("md")]: {
            width: "-webkit-fill-available"
        }
    },
    alignCenter: {
        textAlign: "center"
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
            label={label}
            value={value}
            onChange={handleDateTime(id)}
            ampm={false}
            placeholder="2010/01/01 00:00"
            format="YYYY/MM/DD HH:mm"
            mask="__/__/____ __:__"
            clearable
            disableFuture
            variant="outlined"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}

class MonitoringShiftChecker extends Component {
    state = {
        start_ts: null,
        end_ts: null,
        select_by: "",
        user_id: ""
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    }

    handleDateTime = key => value => {
        this.changeState(key, value);
    }

    handleEventChange = key => event => {
        const { value } = event.target;
        this.changeState(key, value);
    }

    render () {
        const { classes, width } = this.props;
        const { start_ts, end_ts, select_by, user_id } = this.state;

        const label_start = select_by === "shift_date" ? "Shift Start" : "Start Timestamp";
        const label_end = select_by === "shift_date" ? "Shift End" : "End Timestamp"; 

        return (
            <Fragment>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    <Grid 
                        container
                        justify="space-between"
                        alignContent="center"
                        alignItems="center"
                        spacing={2}
                    >
                        <Grid
                            item
                            xs={12}
                            sm={select_by === "staff_name" ? 6 : 12}
                            md={2} 
                            className={`${classes.inputGridContainer} ${classes.alignCenter}`}
                        >
                            <OutlinedSelectInputForm
                                label="Select by"
                                div_id="select_by"
                                changeHandler={this.handleEventChange("select_by")}
                                value={select_by}
                                list={[{ id: "shift_date", label: "Shift Date" }, { id: "staff_name", label: "Staff Name" }]}
                                mapping={{ id: "id", label: "label" }}
                                css={classes.selects}
                            />
                        </Grid>

                        {select_by === "staff_name" && (
                            <Grid item xs={12} sm={6} md={2} className={`${classes.inputGridContainer} ${classes.alignCenter}`}>
                                <DynaslopeUserSelectInputForm
                                    variant="outlined"
                                    label="Staff Name"
                                    div_id="user_id"
                                    changeHandler={this.handleEventChange("user_id")}
                                    value={user_id}
                                    css={classes.selects}
                                />
                            </Grid>
                        )}

                        {
                            [
                                { label: label_start, value: start_ts, id: "start_ts" },
                                { label: label_end, value: end_ts, id: "end_ts" },
                            ].map(row => {
                                const { id } = row;

                                return (
                                    <Grid
                                        item 
                                        xs={12}
                                        sm={6} 
                                        md={3} 
                                        key={id} 
                                        className={`${classes.inputGridContainer} ${classes.alignCenter}`}
                                    >
                                        { createDateTime(row, this.handleDateTime) }
                                    </Grid>
                                );
                            })
                        }

                        <Grid
                            item xs={12} md={2}
                            className={`${classes.inputGridContainer} ${classes.alignCenter}`}
                        >
                            <Button variant="contained" color="secondary" size={isWidthDown("sm", width) ? "small" : "medium"}>
                                Generate <ArrowForwardIos className={classes.button} />
                            </Button>
                        </Grid>
                    </Grid>
                </MuiPickersUtilsProvider>
                
            </Fragment>
        );
    }
}

export default compose(withWidth(), withStyles(styles))(MonitoringShiftChecker);
