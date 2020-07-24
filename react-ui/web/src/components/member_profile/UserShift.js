import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const events = [
    {
        title: "Harle - MT",
        allDay: false,
        start: new Date("2020, 5, 14 08:00:00"),
        end: new Date("2020, 5, 14 20:00:00")
    },
    {
        title: "Long Event",
        start: new Date("2020, 5, 17"),
        end: new Date("2020, 5, 22")
    },
  
];

function MyShifts () {
    const localizer = momentLocalizer(moment);
    return (
        <div style={{ height: 500, width: "100%" }}>
            <Calendar
                events={events}
                localizer={localizer}
                step={60}
                defaultDate={new Date()}
                startAccessor="startDate"
                endAccessor="endDate"
                style={{ width: "100%" }}
            />
        </div>
    );
}
export default MyShifts;


