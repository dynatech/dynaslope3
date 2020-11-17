import React, { 
    useState, useEffect,
    Fragment, useReducer
} from "react";

import {
    InputLabel, makeStyles, FormControl,
    Button, Select, MenuItem, Card, CardContent,
    Typography, Grid, FormHelperText
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import MomentUtils from "@date-io/moment";
import moment from "moment";
import Highcharts from "highcharts";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";

import GeneralStyles, { alert_1, alert_2, alert_3 } from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

const useStyles = makeStyles(theme => {
    const gen = GeneralStyles(theme);
    return {
        ...gen,
        inputGridContainer: {
            margin: "12px 0",
            [theme.breakpoints.down("sm")]: {
                margin: "0 0"
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
        },
        alert3: {
            ...gen.alert3,
            "&:hover *": {
                color: "#222222 !important"
            },
        },
        card: { height: "auto" }
    }; 
});

function CommunicationsAnalytics (props) {
    const classes = useStyles();

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Monitoring Alerts Analytics"
                />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Typography variant="overline" display="block" gutterBottom>
                                    Alerts Summary
                                </Typography>

                                <Grid container spacing={2} justify="space-between">
                                    <Grid item xs={12} sm={3} container>
                                        <MuiPickersUtilsProvider utils={MomentUtils}>
                                            <Grid item xs={12} sm={12}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="Start Timestamp"
                                                    ampm={false}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={12} style={{ marginTop: 16 }}>
                                                <KeyboardDateTimePicker
                                                    required
                                                    autoOk
                                                    label="End Timestamp"
                                                    ampm={false}
                                                    placeholder="2010/01/01 00:00"
                                                    format="YYYY/MM/DD HH:mm"
                                                    mask="____/__/__ __:__"
                                                    clearable
                                                    disableFuture
                                                    fullWidth
                                                />
                                            </Grid>
                                        </MuiPickersUtilsProvider>
                                        <Grid item xs={12} align="right" style={{ marginTop: 16 }}>
                                            <Button 
                                                size="small" 
                                                color="primary"
                                                variant="contained"
                                            >
                                                Submit
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12} sm={8}>
                                        <Typography variant="overline" display="block" gutterBottom>
                                            data here
                                        </Typography>
                                    </Grid>
                                    

                                    
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>
        </Fragment>   
    );
}

export default (CommunicationsAnalytics);