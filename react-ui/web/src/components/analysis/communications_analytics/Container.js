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
                    title="Analysis | Communications Analytics"
                />
            </div>
        </Fragment>        
    );
}

export default (CommunicationsAnalytics);