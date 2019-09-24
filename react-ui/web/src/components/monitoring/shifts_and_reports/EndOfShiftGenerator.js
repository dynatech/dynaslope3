import React, { Component, Fragment, useState, useEffect } from "react";
import moment from "moment";
import { Grid, withStyles, Button, withWidth, Paper, Typography, CircularProgress } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import DetailedExpansionPanels from "./DetailedExpansionPanels";

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
        <KeyboardDateTimePicker
            required
            autoOk
            label={label}
            value={value}
            onChange={handleDateTime}
            ampm={false}
            placeholder="2010/01/01 00:00"
            format="YYYY/MM/DD HH:mm"
            mask="____/__/__ __:__"
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

function prepareEOSRequest (startTs, setEosData, setIsLoading) {
    const moment_start_ts = moment(startTs).format("YYYY-MM-DD HH:mm:ss");
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
    const [startTs, setStartTs] = useState(
        moment().format("YYYY-MM-DD HH:mm:ss")
    );
    const [isLoading, setIsLoading] = useState(false);
    const [eosData, setEosData] = useState(null);

    const handleDateTime = value => {
        setStartTs(value);
    };

    const handleClick = key => event => {
        setIsLoading(true);
        if (key === "generate_report") {
            prepareEOSRequest(startTs, setEosData, setIsLoading);
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
                            { label: "Shift Start", value: startTs, id: "start_ts" },
                        ].map(row => {
                            const { id } = row;

                            return (
                                <Grid item xs={12} md={5} key={id} className={classes.inputGridContainer}>
                                    { createDateTime(row, handleDateTime) }
                                </Grid>
                            );
                        })
                    }

                    <Grid
                        item xs={12} md={2}
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
                <Typography>
                    End of Shift Reports for {moment(startTs).format("D MMMM YYYY, h:mm A")} Shift
                    {
                        isLoading &&
                        <CircularProgress
                            size={24}
                            style={{
                                marginLeft: 15,
                                position: "relative",
                                top: 4
                            }}
                        />
                    }                    
                </Typography>
                <Paper>
                    {
                        eosData !== null && eosData.map(row => {
                            const eos_report = row;
                            // const {  } = eos_data;
                            return (
                                <DetailedExpansionPanels data={eos_report} />
                            );
                        })
                    }
                </Paper>
            </div>
            
        </Fragment>
    );
}

export default compose(withWidth(), withStyles(styles))(EndOfShiftGenerator);
