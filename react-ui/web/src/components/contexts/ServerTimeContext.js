import React, {
    createContext, useState,
    useEffect
} from "react";
import { 
    getServerTime, receiveServerTime
} from "../../websocket/misc_ws";

export const ServerTimeContext = createContext();

export const ServerTimeProvider = ({ children }) => {
    const [server_time, setServerTime] = useState(null);

    useEffect(() => {
        getServerTime();
        receiveServerTime(ts => setServerTime(ts));
    }, []);

    const return_obj = { server_time };

    return (
        <ServerTimeContext.Provider value={return_obj}>
            {children}
        </ServerTimeContext.Provider>
    );
};