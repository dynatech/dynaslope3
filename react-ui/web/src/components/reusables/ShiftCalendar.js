import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import TodayIcon from "@material-ui/icons/Today";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Link } from "react-router-dom";
import { receiveMonitoringShiftData, unsubscribeToMiscWebSocket, subscribeToMiscWebSocket } from "../../websocket/misc_ws";
import { GeneralContext } from "../contexts/GeneralContext";

const useStyles = makeStyles((theme) => ({
    root: {
        width: "auto",
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    icon: {
        verticalAlign: "bottom",
        height: 20,
        width: 20,
    },
    details: {
        alignItems: "center",
    },
    column: {
        flexBasis: "33.33%",
        textAlign: "center",
    },
    helper: {
        borderLeft: `2px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 2),
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline",
        },
    },
    table: {
        minWidth: 420,
        maxWidth: "100%",
        width: "100%",
    },
}));
// this function returns a component displaying cuurent shift and next 2 shifts
function ShiftsPanel (props) {
    const { ShiftData } = props;
    const classes = useStyles();
    const options = { timezone: "Asia/Hongkong", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", hour12: true };
    const [futureShifts, setShifts] = useState([]);

    useEffect(()=>{    
        if (ShiftData !== null || ShiftData !== "undefined") {
            const data = ShiftData.filter(row =>{
                if (moment(row.ts) > moment().subtract({ hours: 12 })) {
                    return row;}
                return null;
            });
            setShifts(data);
        }
    }, [ShiftData]);

    const shift_status = (ts => {
        const now = new Date();
        const shift_start = new Date(ts);
        const shift_end = new Date(ts).addHours(12);
        if (now > shift_start && shift_start <= shift_end) {
            return "Current";}
        if ( now.addHours(12) > shift_start) {
            return "Next";}
        if ( now.addHours(24) > shift_start) {
            return shift_start.toLocaleDateString("en-US", options).toString();}
        return null;
    });

    return (
        <div className={classes.root}>
            <ExpansionPanel defaultClosed>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1c-content"
                    id="panel1c-header"
                    color="red"
                >
                    <div className={classes.column}>
                        <Button className={classes.heading}>
                            SHIFT
                            <TodayIcon className ={classes.icon}/>
                        </Button>        
                    </div>
                    <div className={classes.column} />
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className={classes.details}>
                    {
                        futureShifts !== undefined && futureShifts.slice(0, 3).map((row) => (
                            <div className={classes.column} key={row.ts}>
                                <Typography variant="button" >     
                                    <Box fontWeight="fontWeightBold" m={1}>
                                        { shift_status(row.ts)} 
                                    </Box>              
                                </Typography>
                                <Typography>        
                                    { row.iompmt} (MT)
                                </Typography>
                                <Typography>        
                                    {row.iompct} (CT)
                                </Typography>
                            </div>
                        ))
                    } 
                </ExpansionPanelDetails>
                <Divider />
                <ExpansionPanelActions>
                    <Link to="monitoring/calendar" style={{ textDecoration: "none" }}>
                        <Button size="small" color="primary">
                        Go to Calendar
                        </Button>
                    </Link>
                </ExpansionPanelActions>
            </ExpansionPanel>
        </div>
    );
}

export function ShiftsCalendar (props) {

    const localizer = momentLocalizer(moment);
    const [rows, setRows] = useState([]);
    const [allShifts, setShifts] = useState([]);
    const [events, setEvents] = useState([]);
    const { setIsReconnecting } = useContext(GeneralContext);

    useEffect(()=>{
        subscribeToMiscWebSocket(setIsReconnecting);
        receiveMonitoringShiftData(shift_data => setRows(shift_data));
        return function cleanup () {
            unsubscribeToMiscWebSocket();
        };
    }, []);
    useEffect(()=>{
        if (rows !== null || rows !== "undefined") {  
            const data = rows.filter(row =>{
                if (moment(row.ts) > moment().subtract({ hours: 48 })) {
                    return row;}
            });
            setShifts(data);
        }
    }, [rows]);

    useEffect(() => {
        const data = allShifts.map(row => {
            const start = moment(row.ts);
            const fixed_start = moment(row.ts);
            const end = moment(row.ts);
            let shift;
            const arr = {};
            let force_shift_end; 
            start.hours() > 19 ? shift = "PM" : shift = "AM";
            if (shift === "PM" ) {
                force_shift_end = start.set({ h: 23, m: 59 }).format();
                arr.title = `${row.iompmt }(MT) ${ row.iompct }(CT) - ${ shift}`;
                arr.start = new Date(fixed_start.format());
                arr.end = new Date(force_shift_end);
            } else {
                arr.title = `${row.iompmt }(MT) ${ row.iompct }(CT) - ${ shift}`;
                arr.start = new Date(start.format());
                arr.end = new Date(end.add({ hours: 12 }).format()); }
            return arr;
        });
        setEvents(data);    
    }, [allShifts]);

    const eventStyle = (event, start, end) => {
        const newStyle = {
            backgroundColor: "default",
            color: "white",
            borderRadius: "5px",
            border: "none",
            fontSize: "15px",
        };
        const now = moment();
        if (now > moment(start) && moment() < moment(end)) {
            newStyle.backgroundColor = "green";}
        if (now > moment(end)) {
            newStyle.backgroundColor = "red";}
        if (moment(start).hours() > 19) {
            if (now > moment(start) && now < moment(start).add({ hours: 12 })) {
                newStyle.backgroundColor = "green";}}
        return {
            className: "",
            style: newStyle
        };
    };
    return ( 
        <div style={{ height: 600 }}>           
            <Calendar
                events={events}
                localizer={localizer}
                defaultDate={new Date()}
                eventPropGetter={eventStyle}
                defaultView="month"
                step={120}
                views={["month"]}
                leftMenu
            />           
        </div> 
    );
}
export default ShiftsPanel;
