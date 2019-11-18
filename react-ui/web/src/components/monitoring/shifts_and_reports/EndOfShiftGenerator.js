import React, { Fragment, useState } from "react";
import moment from "moment";
import { Grid, withStyles, Button, withWidth, Paper, Typography, CircularProgress } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import DetailedExpansionPanels from "./DetailedExpansionPanels";
import SelectInputForm from "../../reusables/SelectInputForm";

import { getEndOfShiftReports } from "../ajax";

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
        textAlign: "right",
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
        <KeyboardDatePicker
            required
            autoOk
            label={label}
            value={value}
            onChange={handleDateTime}
            ampm={false}
            placeholder="2010/01/01"
            format="YYYY/MM/DD"
            mask="____/__/__"
            clearable
            disableFuture
            variant="dialog"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}
// eslint-disable-next-line max-params
function prepareEOSRequest (start_ts, shift_time, setEosData, setIsLoading) {
    const time = shift_time === "am" ? "07:30:00" : "19:30:00"; 
    const moment_start_ts = moment(start_ts).format(`YYYY-MM-DD ${time}`);
    const input = {
        shift_start: moment_start_ts
    };

    getEndOfShiftReports(input, ret => {
        setEosData(ret);
        setIsLoading(false);
    });   
}

function EndOfShiftGenerator (props) {
    const { classes, width } = props;
    const datetime_now = moment();
    const dt_hr = datetime_now.hour();
    const [start_ts, setStartTs] = useState(datetime_now.format("YYYY-MM-DD"));
    const [shift_time, setShiftTime] = useState(dt_hr >= 10 && dt_hr <= 22 ? "am" : "pm");
    const [isLoading, setIsLoading] = useState(false);
    const [eosData, setEosData] = useState(null);

    const handleDateTime = value => {
        setStartTs(value);
    };

    const handleClick = key => event => {
        setIsLoading(true);
        if (key === "generate_report") {
            prepareEOSRequest(start_ts, shift_time, setEosData, setIsLoading);
        }
    };

    return (
        <Fragment>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid 
                    container
                    justify="space-between"
                    alignContent="center"
                    alignItems="center"
                    spacing={4}
                >
                    {
                        [
                            { label: "Shift Start", value: start_ts, id: "start_ts" },
                        ].map(row => {
                            const { id } = row;

                            return (
                                <Grid item xs={12} sm key={id} className={classes.inputGridContainer}>
                                    { createDateTime(row, handleDateTime) }
                                </Grid>
                            );
                        })
                    }

                    <Grid item xs={12} sm>
                        <SelectInputForm
                            div_id="shift_time"
                            label="Shift Time"
                            changeHandler={event => setShiftTime(event.target.value)}
                            value={shift_time}
                            list={[{ id: "am", label: "AM" }, { id: "pm", label: "PM" }]}
                            mapping={{ id: "id", label: "label" }}
                            required
                        />
                    </Grid>

                    <Grid
                        item xs={12} sm
                        className={`${classes.inputGridContainer} ${classes.buttonGrid}`}
                    >
                        <Button 
                            variant="contained"
                            color="secondary"
                            size={isWidthDown("sm", width) ? "small" : "medium"}
                            onClick={
                                handleClick("generate_report")
                            }
                        >
                            Generate <ArrowForwardIos className={classes.button} />
                        </Button>
                    </Grid>
                </Grid>
            </MuiPickersUtilsProvider>

            <div className={classes.expansionPanelsGroup}>
                {
                    isLoading ? (
                        <CircularProgress
                            size={24}
                            style={{
                                marginLeft: 15,
                                position: "relative",
                                top: 4
                            }}
                        />
                    ) : (
                        <Paper>
                            {
                                eosData !== null && eosData.map(row => {
                                    const eos_report = row;
                                    return (
                                        <DetailedExpansionPanels data={eos_report} />
                                    );
                                })
                            }
                        </Paper>
                    )
                }
               
            </div>
            
        </Fragment>
    );
}

export default compose(withWidth(), withStyles(styles))(EndOfShiftGenerator);
