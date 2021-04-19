import React, {
    createContext, useState,
    useEffect
} from "react";

import moment from "moment";

import { 
    getMonitoringShifts, receiveMonitoringShiftData, 
    removeReceiveMonitoringShiftData
} from "../../websocket/misc_ws";
import { getUserByNickname } from "./ajax";

export const MonitoringShiftsContext = createContext();

function getCurrentShift (monitoring_shifts) {
    const now = moment();

    const result = monitoring_shifts.find(row => {
        const shift_start = moment(row.ts).add(30, "minutes");
        const shift_end = moment(row.ts).add(12, "hours");

        if (shift_start <= now && now < shift_end) {
            return row;
        }

        return false;
    });

    return result;
}

export const MonitoringShiftsProvider = ({ children }) => {
    const [monitoring_shifts, setMonitoringShifts] = useState([]);
    const [current_ct, setCurrentCT] = useState("");

    useEffect(() => {
        getMonitoringShifts();
        receiveMonitoringShiftData(shift_data => {
            setMonitoringShifts(shift_data);
            const current_shift = getCurrentShift(shift_data);

            if (current_shift) {
                const { iompct } = current_shift;
                getUserByNickname(iompct, data => {
                    setCurrentCT(data);
                });
            }
        });

        return function cleanup () {
            removeReceiveMonitoringShiftData();
        };
    }, []);

    const return_obj = { monitoring_shifts, current_ct };

    return (
        <MonitoringShiftsContext.Provider value={return_obj}>
            {children}
        </MonitoringShiftsContext.Provider>
    );
};