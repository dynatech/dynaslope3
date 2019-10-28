import React, { Fragment, useState, useEffect } from "react";
import { Grid, withStyles, Button, withWidth, Paper, Divider, Typography } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, DateTimePicker, DatePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import moment from "moment";
import { Route, Switch, Link } from "react-router-dom";
import converter from "number-to-words";

// EXP IMPORTS
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
// import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

// User Defined Imports
import GeneralStyles from "../../../GeneralStyles";
import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { getShiftData } from "../ajax";

// Session Stuff
// import { getCurrentUser } from "../../sessions/auth";

// Linking to Event Timeline
import EventTimeline from "../events_table/EventTimeline";

const styles = theme => {
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
        alignCenter: {
            textAlign: "center"
        },
        button: {
            fontSize: 16,
            paddingLeft: 8
        },
        def_padding: {
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
        link: {
            textDecoration: "none"
        },
        valueFont: {
            color: "black"
        },

        summary: {
            // display: "flex",
            justifyContent: "space-evenly"
        }
    };
};

function prepareEventTimelineLink (classes, event_id, site_code) {
    return (
        <Link
            className={classes.link}
            to={`events/${event_id}`}
        >
            {site_code.toUpperCase()}
        </Link>
    );
}


function capitalize (s) {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}


function processShiftData (classes, select_by, raw_data) {
    let new_data = [];

    if (select_by === "staff_name") {
        new_data = raw_data.map((row, index1) => {
            const { date, data, ampm, mt, ct } = row;

            const word_temp = converter.toWords(data.length);
            const alert_summary = `${capitalize(word_temp)} (${data.length})`;
            const new_stuff = data.map((second_row, index2) => {
                const {
                    general_status, site_code, 
                    public_alert_level, event_id
                } = second_row;

                const event_link = prepareEventTimelineLink(classes, event_id, site_code);

                return (
                    <Grid item xs={4} key={`site_alert_${ index2 + 1}`}>
                        <Typography variant="body2" color="textSecondary">
                            Site code: <span className={classes.valueFont}>{event_link}</span>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Alert <span className={classes.valueFont}>{public_alert_level}</span>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Monitoring status: <span className={classes.valueFont}>{capitalize(general_status)}</span>
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
                            <Grid item xs={6} className={classes.alignCenter}>
                                <Typography color="textSecondary">
                                    Shift Date: <span className={classes.valueFont}>{moment(date).format("MMMM D, YYYY")}</span>
                                </Typography>
                            </Grid>
                            <Grid item xs={6} className={classes.alignCenter}>
                                <Typography color="textSecondary">
                                    Sites Monitored: <span className={classes.valueFont}>{alert_summary}</span>
                                </Typography>
                            </Grid>
                        </Grid>
                    </ExpansionPanelSummary>
                    <Divider />
                    <ExpansionPanelDetails>
                        <Grid container spacing={2} className={classes.def_padding}>
                            <Grid item xs={4}>
                                <Typography variant="body1" color="textPrimary" className={classes.alignCenter}>
                                    {ampm}
                                </Typography>
                                <Typography variant="body1" color="textSecondary" className={classes.alignCenter}>
                                    Shift Schedule
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body1" color="textPrimary" className={classes.alignCenter}>
                                    {mt}
                                </Typography>
                                <Typography variant="body1" color="textSecondary" className={classes.alignCenter}>
                                    MT Personnel
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body1" color="textPrimary" className={classes.alignCenter}>
                                    {ct}
                                </Typography>
                                <Typography variant="body1" color="textSecondary" className={classes.alignCenter}>
                                    CT Personnel
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
    } else if (select_by === "shift_date") {
        new_data = raw_data.map((row, index1) => {
            const { public_alert_level, data } = row;

            const word_temp = converter.toWords(data.length);
            const alert_summary = `${capitalize(word_temp)} (${data.length})`;
            const new_stuff = data.map((second_row, index2) => {
                const {
                    general_status, site_code, event_id
                } = second_row;

                const event_link = prepareEventTimelineLink(classes, event_id, site_code);

                return (
                    <Grid item xs={4} key={`site_alert_${ index2 + 1}`}>
                        <Typography variant="body2" color="textSecondary">
                            Site code: <span className={classes.valueFont}>{event_link}</span>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Monitoring status: <span className={classes.valueFont}>{capitalize(general_status)}</span>
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
                            <Grid item xs={6} className={classes.alignCenter}>
                                <Typography color="textSecondary">
                                    <span className={classes.valueFont}>Alert {public_alert_level}</span>
                                </Typography>
                            </Grid>
                            <Grid item xs={6} className={classes.alignCenter}>
                                <Typography color="textSecondary">
                                    Number of sites: <span className={classes.valueFont}>{alert_summary}</span>
                                </Typography>
                            </Grid>
                        </Grid>
                    </ExpansionPanelSummary>
                    <Divider />
                    <ExpansionPanelDetails>
                        <Grid container spacing={2} className={classes.def_padding}>
                            {
                                new_stuff                            
                            }
                        </Grid>
                    </ExpansionPanelDetails>
                </ExpansionPanel>                         
            );
        });
    }
    
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


function prepareDataHeader (classes, ui_data, handlers) {
    let dom_elements;
    const { select_by, setDataHeader, payload: { ts_start, ts_end } } = handlers;
    const ui_ts_start = moment(ts_start).format("MMMM D, YYYY");
    const ui_ts_end = moment(ts_end).format("MMMM D, YYYY");
    if (select_by === "shift_date") {
        const temp = ui_data[0];
        const {
            ampm, ct, mt
        } = temp;

        dom_elements = (
            <Paper className={classes.def_padding}>
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <Typography className={classes.alignCenter} variant="body1" color="textSecondary">
                            Shift Date
                        </Typography>
                        <Typography className={classes.alignCenter} variant="body1" color="textPrimary">
                            {ui_ts_start}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography className={classes.alignCenter} variant="body1" color="textSecondary">
                            Shift Schedule
                        </Typography>
                        <Typography className={classes.alignCenter} variant="body1" color="textPrimary">
                            {ampm}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography className={classes.alignCenter} variant="body1" color="textSecondary">
                            MT Personnel
                        </Typography>
                        <Typography className={classes.alignCenter} variant="body1" color="textPrimary">
                            {mt}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography className={classes.alignCenter} variant="body1" color="textSecondary">
                            CT Personnel
                        </Typography>
                        <Typography className={classes.alignCenter} variant="body1" color="textPrimary">
                            {ct}
                        </Typography>
                    </Grid>
                </Grid>                
            </Paper>
        );
    } else {
        dom_elements = (
            <Paper className={classes.def_padding}>
                <Typography variant="body1" color="textPrimary">
                    {ui_ts_start} to {ui_ts_end}
                </Typography>
            </Paper>
        );
    }

    setDataHeader(dom_elements);
}


function MonitoringShiftChecker (props) {
    const { classes, width, location,
        match: url
    } = props;
    // const current_user = getCurrentUser();

    const [ts_start, setTSStart] = useState(null);
    const [ts_end, setTSEnd] = useState(null);
    const [shift_date, setShiftDate] = useState(null);
    const [shift_sched, setShiftSched] = useState("");
    const [select_by, setSelectBy] = useState("staff_name");
    // const [user_id, setUserID] = useState((current_user.user_id));
    const [user_id, setUserID] = useState("");

    const [payload, setPayload] = useState({});
    const [data_header, setDataHeader] = useState("");
    const [shift_data, setShiftData] = useState("Please enter filters.");

    useEffect(() => {
        if (select_by === "staff_name") {
            // setDataHeader("");
            // setShiftData("Please enter filters.");
            setPayload({
                ts_start: moment(ts_start).format("YYYY-MM-DD HH:mm:ss"), 
                ts_end: moment(ts_end).format("YYYY-MM-DD HH:mm:ss"), 
                user_id
            });
            
        } else if (select_by === "shift_date") {
            // setDataHeader("");
            // setShiftData("Please enter filters.");
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

    const handleSubmit = () => {
        getShiftData(payload, ret => {
            const handler = { select_by, setDataHeader, payload };
            prepareDataHeader(classes, ret, handler);
            const processed_data = processShiftData(classes, select_by, ret);
            setShiftData((
                <Typography style={{ fontStyle: "italic" }}>
                No shift data
                </Typography>
            ));
            if (processed_data.length > 0) setShiftData(processed_data);
        });

    };

    return (
        <Fragment>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Switch location={location}>
                    <Route exact path={url} render={
                        new_props => (
                            <Grid 
                                container
                                justify="space-between"
                                alignContent="center"
                                spacing={2}
                            >
                                <Grid item sm={12} md={3}>
                                    <Paper className={classes.def_padding}>
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
                                                    ].map((row, index) => {
                                                        return (
                                                            <div key={row.id} className={classes.form_input}>
                                                                {createDateTime(row, handleDateTime)}
                                                            </div>
                                                        );
                                                    })
                                                }         
                                            </Fragment>
                                        )}

                                        <div style={{ textAlign: "right", paddingTop: 16 }}>
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
                                    <div className={classes.root}>
                                        {data_header}                                       
                                        {shift_data}
                                    </div>
                                </Grid>
                    
                            </Grid>
                        )
                    }/>

                    <Route path={`${url}/:event_id`} render={
                        new_props => (
                            <EventTimeline
                                {...props}
                                width={width}
                            />
                        )
                    }/>
                </Switch>
            </MuiPickersUtilsProvider>
        
        </Fragment>
    );
}

export default compose(withWidth(), withStyles(styles))(MonitoringShiftChecker);


