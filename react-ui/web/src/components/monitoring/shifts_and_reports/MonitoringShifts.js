import React, { useState, useEffect } from "react";

import { Grid, makeStyles, Button, withWidth, Paper, Divider, Typography } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos, Today } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, DateTimePicker } from "@material-ui/pickers";
import moment from "moment";
import { Link } from "react-router-dom";
import converter from "number-to-words";

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import GeneralStyles from "../../../GeneralStyles";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { getShiftData } from "../ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";
import MonitoringShiftsCalendar from "../../widgets/monitoring_shifts/MonitoringShiftsCalendar";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    return {
        inputGridContainer: {
            margin: "12px 0",
            [theme.breakpoints.down("sm")]: {
                margin: "0 0"
            }
        },
        divider: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        selects: {
            width: "auto",
            [theme.breakpoints.up("md")]: {
                width: "-webkit-fill-available"
            }
        },
        link: {
            textDecoration: "none"
        },
        valueFont: {
            color: "black",
            textDecoration: "none"
        },
        hidden: { display: "none !important" }
    };
});

function prepareEventTimelineLink (classes, event_id, site_code) {
    return (
        <Link
            className={classes.link}
            to={`/monitoring/events/${event_id}`}
            target="_blank"
        >
            {site_code.toUpperCase()}
        </Link>
    );
}

function processShiftData (classes, raw_data) {
    const new_data = raw_data.map((row, index1) => {
        const { date, data, ampm, mt, ct } = row;

        const word_temp = converter.toWords(data.length);
        const alert_summary = `${capitalizeFirstLetter(word_temp)} (${data.length})`;
        const new_stuff = data.map((second_row, index2) => {
            const {
                general_status, site_code, 
                public_alert_level, event_id,
                internal_alert
            } = second_row;

            const event_link = prepareEventTimelineLink(classes, event_id, site_code);

            return (
                <Grid 
                    container justify="space-evenly"
                    direction="column"
                    item xs={4} key={`site_alert_${ index2 + 1}`}
                >
                    <Typography variant="body2" align="center">
                        <span className={classes.valueFont}>{event_link}</span>
                    </Typography>
                    <Typography variant="body2" align="center">
                        <span className={classes.valueFont}>Alert {public_alert_level} ({internal_alert})</span>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                            Monitoring status: <span className={classes.valueFont}>{capitalizeFirstLetter(general_status)}</span>
                    </Typography>
                </Grid>
            );
        });

        return (
            <ExpansionPanel key={`monitoring_date_${ index1 + 1}`}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Grid container>
                        <Grid item xs={4}>
                            <Typography color="textSecondary" align="center">
                                Shift Date: <span className={classes.valueFont}>{moment(date).format("MMMM D, YYYY")}</span>
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography color="textSecondary" align="center">
                                Sites Monitored: <span className={classes.valueFont}>{alert_summary}</span>
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography color="textSecondary" align="center">
                                Shift Schedule: <span className={classes.valueFont}>{ampm}</span>
                            </Typography>
                        </Grid>
                    </Grid>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails>
                    <Grid container spacing={2} className={classes.def_padding}>
                        <Grid item xs={4}>
                            <Typography variant="body1" color="textSecondary" align="center">
                                Shift Schedule
                            </Typography>
                            <Typography variant="body1" color="textPrimary" align="center">
                                {ampm}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body1" color="textSecondary" align="center">
                                MT Personnel
                            </Typography>
                            <Typography variant="body1" color="textPrimary" align="center">
                                {mt}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body1" color="textSecondary" align="center">
                                    CT Personnel
                            </Typography>
                            <Typography variant="body1" color="textPrimary" align="center">
                                {ct}
                            </Typography>
                        </Grid>
                        <div style={{ paddingTop: 20, paddingBottom: 20 }}>
                            <Divider />
                        </div>                            
                        {
                            new_stuff                            
                        }
                    </Grid>
                </ExpansionPanelDetails>
                <Divider />
            </ExpansionPanel>                         
        );
    });
    
    return new_data;
}

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
            inputVariant="outlined"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}

function MonitoringShifts (props) {
    const {
        hidden, width,
        defaultCalendarOpen
    } = props;
    const classes = useStyles();

    const [ts_start, setTSStart] = useState(null);
    const [ts_end, setTSEnd] = useState(null);
    const [user_id, setUserID] = useState("");

    const [payload, setPayload] = useState({});
    const [shift_data, setShiftData] = useState("");

    useEffect(() => {
        setPayload({
            ts_start: moment(ts_start).format("YYYY-MM-DD HH:mm:ss"), 
            ts_end: moment(ts_end).format("YYYY-MM-DD HH:mm:ss"), 
            user_id
        });
    }, [ts_start, ts_end, user_id]);

    const handleDateTime = key => value => {
        switch (key) {
            case "ts_start":
                setTSStart(value);
                break;
            case "ts_end":
                setTSEnd(value);
                break;
            default:
                break;
        }
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        switch (key) {
            case "user_id":
                setUserID(value);
                break;
            default:
                break;
        }        
    };

    const handleSubmit = () => {
        getShiftData(payload, ret => {
            const processed_data = processShiftData(classes, ret);
            setShiftData((
                <Typography style={{ fontStyle: "italic" }}>
                    No shift data
                </Typography>
            ));

            if (processed_data.length > 0) setShiftData(processed_data);
        });
    };

    return (
        <div className={ hidden ? classes.hidden : "" }>
            <ExpansionPanel defaultExpanded={defaultCalendarOpen}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1c-content"
                    id="panel1c-header"
                >
                    <Typography variant="body1" component={Grid} container>
                        <Today style={{ marginRight: 8 }} /> <div><strong>MONITORING SHIFTS CALENDAR</strong></div>
                    </Typography>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails>
                    <MonitoringShiftsCalendar />
                </ExpansionPanelDetails>
            </ExpansionPanel>

            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Paper
                    component={Grid}
                    container spacing={2} 
                    style={{ marginTop: 16, marginBottom: 16, padding: 8 }}
                    alignItems="center"
                >
                    <Grid item xs={12}>
                        <Typography variant="h6">
                            <strong>MONITORING SHIFT CHECKER</strong>
                        </Typography>

                        <Typography variant="subtitle2">
                            <i>Note: The checker currently shows event and extended releases only. Routine releases are NOT yet reflected.</i>
                        </Typography>
                    </Grid>
            
                    <Grid container spacing={2} item xs={12} sm={10}>
                        {
                            [
                                { label: "Start Timestamp", value: ts_start, id: "ts_start" },
                                { label: "End Timestamp", value: ts_end, id: "ts_end" },
                            ].map(row => {
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={row.id}>
                                        {createDateTime(row, handleDateTime)}
                                    </Grid>
                                );
                            })
                        }

                        <Grid item xs={12} sm={6} md={4}>
                            <DynaslopeUserSelectInputForm
                                label="Staff Name"
                                div_id="user_id"
                                changeHandler={handleEventChange("user_id")}
                                value={user_id}
                                css={classes.selects}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>

                    <Grid item xs={12} sm container justify="center">
                        <Button variant="contained" 
                            color="secondary" 
                            size={isWidthDown("sm", width) ? "small" : "medium"}
                            onClick={handleSubmit}
                            endIcon={<ArrowForwardIos />}
                        >
                            Generate
                        </Button>
                    </Grid>
                </Paper>

                <Grid item sm={12}>                                      
                    {shift_data}
                </Grid>
            </MuiPickersUtilsProvider>
        </div>
    );
}

export default withWidth()(MonitoringShifts);


