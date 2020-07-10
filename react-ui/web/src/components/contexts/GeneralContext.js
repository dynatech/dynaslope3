import React, {
    createContext, useState,
    useEffect
} from "react";
import { useSnackbar } from "notistack";
import { getSites, getUsers, getOrganizations } from "./ajax";

export const GeneralContext = createContext();

export const GeneralProvider = ({ children }) => {
    const [refreshUser, setRefreshUser] = useState(true);
    const [users, setUsers] = useState([]);
    const [sites, setSites] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [is_reconnecting, setIsReconnecting] = useState(null);

    useEffect(() => {
        getSites(data => {
            setSites(data);
        });
    }, []);

    useEffect(() => {
        if (refreshUser) {
            getUsers(data => {
                setUsers(data);
                setRefreshUser(false);
            });
        }
       
    }, [refreshUser]);

    useEffect(() => {
        getOrganizations(data => {
            setOrganizations(data);
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
        organizations,
        is_reconnecting,
        setRefreshUser,
        setIsReconnecting
    };

    return (
        <GeneralContext.Provider value={return_obj}>
            {children}
        </GeneralContext.Provider>
    );
};