import React, {
    createContext, useState,
    useEffect
} from "react";
import { useSnackbar } from "notistack";
import { getSites, getUsers, getOrganizations } from "./ajax";
import { 
    getServerTime, receiveServerTime
} from "../../websocket/misc_ws";

export const GeneralContext = createContext();

export const GeneralProvider = ({ children }) => {
    const [refresh_sites, setRefreshSites] = useState(true);
    const [users, setUsers] = useState([]);
    const [sites, setSites] = useState([]);
    const [all_sites_including_inactive, SetAllSites] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [is_reconnecting, setIsReconnecting] = useState(null);
    const [server_time, setServerTime] = useState(null);

    useEffect(() => {
        if (refresh_sites) {
            getSites(data => {
                const active = data.filter(x => x.active);
                setSites(active);
                SetAllSites(data);
                setRefreshSites(false);
            });
        }
    }, [refresh_sites]);

    useEffect(() => {
        getUsers(data => {
            setUsers(data);
            
        });
    }, []);

    useEffect(() => {
        getOrganizations(data => {
            setOrganizations(data);
        });
    }, []);

    useEffect(() => {
        getServerTime();
        receiveServerTime(ts => {
            setServerTime(ts);
        });
    }, []);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [key, setKey] = useState(null);

    useEffect(() => {
        if (is_reconnecting !== null) {
            if (is_reconnecting === true) {
                const h_key = enqueueSnackbar(
                    "Connection lost... Features will not work properly... Reconnecting...",
                    {
                        variant: "warning",
                        persist: true
                        // autoHideDuration: 7000,
                        // action: snackBarActionFn
                    }
                );
                setKey(h_key);
            } else {
                closeSnackbar(key);
                enqueueSnackbar(
                    "Reconnection successful...",
                    {
                        variant: "success",
                        autoHideDuration: 5000,
                    // action: snackBarActionFn
                    }
                );
            }
        }
    }, [is_reconnecting]);

    const return_obj = {
        users,
        sites,
        all_sites_including_inactive,
        organizations,
        is_reconnecting,
        setIsReconnecting,
        setRefreshSites, 
        server_time
    };

    return (
        <GeneralContext.Provider value={return_obj}>
            {children}
        </GeneralContext.Provider>
    );
};