import React, { Fragment, useState, useEffect } from "react";
import { Grid, withStyles, Button, withWidth, Paper, Divider, Typography } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, DateTimePicker, DatePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import moment from "moment";

// EXP IMPORTS
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { getShiftData } from "../ajax";

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
    },
    paper: {
        padding: 16
    },
    form_input: {
        paddingTop: 10
    },

    // EXP REL styles
    root: {
        width: "100%",
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
});


function processShiftData (classes, select_by, raw_data) {
    console.log(raw_data);
    let new_data;

    if (select_by === "staff_name") {
        new_data = raw_data.map((row, index) => {
            console.log(index);
            const { date, data, ampm } = row;

            const new_stuff = data.map((second_row, index) => {
                const {
                    general_status, site_code, 
                    public_alert_symbol, internal_alert, event_id,
                    release_id, release_time, data_ts, public_alert_level,
                    comments
                } = second_row;

                return (
                    <Grid item xs={3}>
                        <Typography color="textPrimary">
                            {`${site_code.toUpperCase()} | ${public_alert_symbol} | ${general_status}`}
                        </Typography>
                    </Grid>
                );
            });

            return (

                // <Grid item xs={6} sm={4} key={`grid-${index + 1}`}>
                //     <Card className={classes.card}>
                //         <CardContent>
            // <Typography className={classes.title} color="textSecondary" gutterBottom>
            //     Shift Date
            // </Typography>
            // <Typography variant="h5" component="h2">
            //     {date}
            // </Typography>
            // <Typography className={classes.pos} color="textSecondary">
            //     {ampm}
            // </Typography>
            // {
            //     new_stuff                            
            // }
                //         </CardContent>
                //         {/* <CardActions>
                //             <Button size="small">Learn More</Button>
                //         </CardActions> */}
                //     </Card>
                // </Grid>    
                <ExpansionPanel>
                    <ExpansionPanelSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography className={classes.heading}>{date}</Typography>
                    </ExpansionPanelSummary>
                    <Divider />
                    <ExpansionPanelDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography color="textSecondary" gutterBottom>
                                    Shift Schedule: {ampm}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">
                                    Partner: {"In the works..."}
                                </Typography>
                            </Grid>
                            {
                                new_stuff                            
                            }
                        </Grid>
                    </ExpansionPanelDetails>
                    <Divider />
                    {/* <ExpansionPanelActions>
                        <Button size="small">
                            <SaveAlt className={classes.icons} /> {showTextLabel("Download Charts", width)}
                        </Button>
                        <Button size="small">
                            <Refresh className={classes.icons} /> {showTextLabel("Refresh", width)}
                        </Button>
                        <Button size="small" color="primary">
                            <Send className={classes.icons} /> {showTextLabel("Send", width)}
                        </Button>
                    </ExpansionPanelActions> */}

                </ExpansionPanel>                         
            );
        });
    }

    console.log("new_data", new_data);
    
    return new_data;
}


function get_shift_timestamps (shift_date, shift_sched) {
    let shift_start = null;
    let shift_end = null;
    if (shift_sched === "am") {
        const temp = moment(shift_date).set({
            hour: 7,
            minute: 30,
            second: 0
        });
        shift_start = moment(temp).format("YYYY-MM-DD HH:mm:ss");
        shift_end = moment(temp).add(13, "hours")
        .format("YYYY-MM-DD HH:mm:ss");
    } else if (shift_sched === "pm") {
        const temp = moment(shift_date).set({
            hour: 7,
            minute: 30,
            second: 0
        });        
        shift_start = moment(temp).format("YYYY-MM-DD HH:mm:ss");
        shift_end = moment(temp).add(13, "hours")
        .format("YYYY-MM-DD HH:mm:ss");
    }

    return { shift_start, shift_end };
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
            variant="outlined"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}


function MonitoringShiftChecker (props) {
    const { classes, width } = props;
    const [ts_start, setTSStart] = useState(null);
    const [ts_end, setTSEnd] = useState(null);
    const [shift_date, setShiftDate] = useState(null);
    const [shift_sched, setShiftSched] = useState("");
    const [select_by, setSelectBy] = useState("shift_date");
    const [user_id, setUserID] = useState("");

    const [payload, setPayload] = useState({});
    const [shift_data, setShiftData] = useState("test");

    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (select_by === "staff_name") {
            setPayload({
                ts_start: moment(ts_start).format("YYYY-MM-DD HH:mm:ss"), 
                ts_end: moment(ts_end).format("YYYY-MM-DD HH:mm:ss"), 
                user_id
            });
            
        } else if (select_by === "shift_date") {
            const { shift_start, shift_end } = get_shift_timestamps(shift_date, shift_sched);
            setPayload({
                ts_start: shift_start,
                ts_end: shift_end
            });
        } else {
            console.error("PROBLEM WITH HANDLE SUBMIT. 'select_by' provided is undefined.");
        }
    }, [select_by, ts_start, ts_end, user_id, shift_date, shift_sched]);

    const handleDateTime = key => value => {
        switch (key) {
            case "ts_start":
                setTSStart(value);
                setTSEnd(moment(value).add(14, "days"));
                break;
            case "ts_end":
                setTSEnd(value);
                break;
            case "shift_date":
                setShiftDate(value);
                break;
            default:
                break;
        }
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        switch (key) {
            case "shift_sched":
                setShiftSched(value);
                break;
            case "select_by":
                setSelectBy(value);
                break;
            case "user_id":
                setUserID(value);
                break;
            default:
                break;
        }        
    };

    const handleChange = panel => (event, isExpanded) => {
        console.log("event", event);
        console.log("isExpanded", isExpanded);  
        setExpanded(isExpanded ? panel : false);
    };  

    const handleSubmit = () => {
        console.log(`SUBMITTED  ${select_by}`);

        console.log(payload);

        getShiftData(payload, ret => {
            // const processed_data = processShiftData(classes, select_by, ret);
            const processed_data = processShiftData(classes, select_by, ret);
            setShiftData(processed_data);
        });

    };

    console.log(select_by);

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
                    <Grid item sm={12} md={3}>
                        <Paper className={classes.paper}>
                            <div className={classes.form_input}>
                                <SelectInputForm
                                    label="Select by"
                                    div_id="select_by"
                                    changeHandler={handleEventChange("select_by")}
                                    value={select_by}
                                    list={[{ id: "shift_date", label: "Shift Date" }, { id: "staff_name", label: "Staff Name" }]}
                                    mapping={{ id: "id", label: "label" }}
                                    // css={classes.selects}
                                />
                            </div>
                            {select_by === "shift_date" && (
                                <Fragment>
                                    <div className={classes.form_input}>
                                        <SelectInputForm
                                            label="AM or PM?"
                                            div_id="shift_sched"
                                            changeHandler={handleEventChange("shift_sched")}
                                            value={shift_sched}
                                            list={[{ id: "am", label: "AM Shift" }, { id: "pm", label: "PM Shift" }]}
                                            mapping={{ id: "id", label: "label" }}
                                        // css={classes.selects}
                                        />

                                    </div>

                                    <div className={classes.form_input}>

                                        <DatePicker
                                            required
                                            autoOk
                                            label="Shift Date"
                                            value={shift_date}
                                            onChange={handleDateTime("shift_date")}
                                            ampm={false}
                                            placeholder="2010/01/01"
                                            format="YYYY/MM/DD"
                                            mask="__/__/____"
                                            clearable
                                            disableFuture
                                            variant="outlined"
                                            fullWidth
                                            InputProps={{
                                                style: { paddingRight: 0 }
                                            }}
                                        />
                                    </div>
                                </Fragment>
                            )}

                            {select_by === "staff_name" && (
                                <Fragment>

                                    <div className={classes.form_input}>
                                        <DynaslopeUserSelectInputForm
                                            label="Staff Name"
                                            div_id="user_id"
                                            changeHandler={handleEventChange("user_id")}
                                            value={user_id}
                                            // css={classes.selects}
                                            variant="standard"
                                        />
                                    </div>

                                    {
                                        [
                                            { label: "Start Timestamp", value: ts_start, id: "ts_start" },
                                            { label: "End Timestamp", value: ts_end, id: "ts_end" },
                                        ].map(row => {
                                            const { id } = row;

                                            return (
                                                <div className={classes.form_input}>
                                                    {createDateTime(row, handleDateTime)}
                                                </div>
                                            );
                                        })
                                    }         
                                </Fragment>
                            )}

                            <div style={{ paddingTop: 20, paddingBottom: 20 }}>
                                <Divider />
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <Button variant="contained" 
                                    color="secondary" 
                                    size={isWidthDown("sm", width) ? "small" : "medium"}
                                    onClick={handleSubmit}
                                >
                                        Generate <ArrowForwardIos className={classes.button} />
                                </Button>                                
                            </div>
                        </Paper>
                    </Grid>

                    <Grid item sm={12} md={9}>
                        {/* <Grid container spacing={6}>
                            {shift_data}
                        </Grid> */}
                        <div className={classes.root}>
                            {shift_data}
                        </div>
                    </Grid>
                    
                </Grid>
            </MuiPickersUtilsProvider>
        
        </Fragment>
    );
}

export default compose(withWidth(), withStyles(styles))(MonitoringShiftChecker);
