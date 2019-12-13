import React, {
    createContext, useState,
    useEffect
} from "react";
import { getSites, getUsers, getOrganizations } from "./ajax";

export const GeneralContext = createContext();

export const GeneralProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [sites, setSites] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        getSites(data => {
            setSites(data);
        });
    }, []);

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

    const return_obj = {
        users,
        sites,
        organizations
    };

    return (
        <GeneralContext.Provider value={return_obj}>
            {children}
        </GeneralContext.Provider>
    );
};