import React, { useState, useEffect, useContext } from "react";

import moment from "moment";
import { Popover, Typography } from "@material-ui/core";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { MonitoringShiftsContext } from "../../contexts/MonitoringShiftsContext";


function Event ({ event }) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = e => {
        setAnchorEl(e.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? "simple-popover" : undefined;
    
    return (
        <div style={{ width: "inherit" }}>
            <div aria-describedby={id} onClick={handleClick} role="button" tabIndex="0">
                { event.title }
            </div>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <Typography variant="body1" style={{ padding: 8 }}>{ event.title }</Typography>
            </Popover>
        </div>
    );
}

function MonitoringShiftsCalendar (props) {
    const { nickname } = props;
    const has_nickname = typeof nickname !== "undefined"; // Return one user only
    // used in Profiles Page
    
    const { monitoring_shifts: allShifts } = useContext(MonitoringShiftsContext);

    const localizer = momentLocalizer(moment);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const data = allShifts.flatMap(row => {
            const start = moment(row.ts);
            const end = moment(row.ts);
            const time = start.hours() > 19 ? "PM" : "AM";

            let ts_end = end.add(12, "hours");
            if (time === "PM") {
                ts_end = start.set({ h: 23, m: 59 }); 
            }

            if (has_nickname) {
                let name = null;
                if (row.iompmt === nickname) name = `${nickname} (MT`;
                if (row.iompct === nickname) name = `${nickname} (CT`;

                if (name) {
                    return [{
                        title: `${name} - ${time})`,
                        start,
                        end: ts_end
                    }];
                }
            } else {
                return [{
                    title: `${row.iompmt} (MT - ${time})`,
                    start,
                    end: ts_end
                }, {
                    title: `${row.iompct} (CT - ${time})`,
                    start,
                    end: ts_end
                }];
            }
        });

        setEvents(data);    
    }, [allShifts, nickname]);

    const now = moment();
    const color_night = "#053752";
    const color_day = "#E5DE44";
    const eventStyle = (event, ts_start, ts_end) => {
        const start = moment(ts_start);

        let backgroundColor = color_day;
        let color = "black";
        if (start.hours() > 19) {
            backgroundColor = color_night;
            color = "white";
        }

        return {
            className: "",
            style: {
                color,
                borderRadius: 5,
                border: "none",
                fontSize: 12,
                backgroundColor
            }
        };
    };

    const customDayPropGetter = date => {
        const hr = now.hours();
        const moment_date = moment(date);
        const day_before = now.clone().subtract(1, "day");
        const is_pm_early_morn = hr < 8 && day_before.isSame(moment_date, "day");
        const is_today = hr >= 8 && moment_date.isSame(now, "day");

        if (is_pm_early_morn || is_today) {
            const color = (hr >= 8 && hr < 20) ? color_day : color_night;

            return {
                className: "current-shift",
                style: {
                    border: `dashed 5px ${color}`,
                },
            };
        }
        
        return {};
    };

    return ( 
        <div style={{ height: has_nickname ? 300 : 850, width: "-webkit-fill-available" }}>
            <Typography variant="subtitle2" align="center">
                <i>Note: The border color of the bordered box specifies the current monitoring shift.</i>
            </Typography>

            <Calendar
                events={events}
                localizer={localizer}
                defaultDate={new Date()}
                eventPropGetter={eventStyle}
                defaultView="month"
                dayPropGetter={customDayPropGetter}
                views={["month"]}
                components={{
                    event: Event
                }}
                popup
            />           
        </div> 
    );
}

export default React.memo(MonitoringShiftsCalendar);
