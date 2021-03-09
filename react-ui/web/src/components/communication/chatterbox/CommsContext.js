import React, { createContext, useState, useEffect, useReducer } from "react";
import { receiveAllContacts, removeReceiveAllContacts } from "../../../websocket/communications_ws";

export const CommsContext = createContext();

const initial_state = {
    sites: [],
    orgs: [],
    only_ewi_recipients: false,
    include_inactive_numbers: false,
    ts_start: null,
    ts_end: null,
    string_search: "",
    tag_search: { value: "" },
    mobile_number_search: "",
    name_search: ""
};

function reducer (state, action) {
    const { type, value } = action;

    switch (type) {
        case "UPDATE_SITES": {
            let temp_value = value;
            if (temp_value === null) {
                temp_value = [];
            }

            return {
                ...state,
                sites: temp_value
            };
        }

        case "UPDATE_ORGS": {
            let temp_value = value;
            if (temp_value === null) {
                temp_value = [];
            }

            return {
                ...state,
                orgs: temp_value
            };
        }

        case "UPDATE_ONLY_EWI_RECIPIENTS": {
            return {
                ...state,
                only_ewi_recipients: value
            };
        }

        case "UPDATE_INCLUDE_INACTIVE_NUMBERS": {
            return {
                ...state,
                include_inactive_numbers: value
            };
        }

        case "UPDATE_TS_START": {
            return {
                ...state,
                ts_start: value
            };
        }

        case "UPDATE_TS_END": {
            return {
                ...state,
                ts_end: value
            };
        }

        case "UPDATE_STRING_SEARCH": {
            return {
                ...state,
                string_search: value
            };
        }

        case "UPDATE_TAG_SEARCH": {
            let temp_value = value;
            if (temp_value === null) {
                temp_value = { value: "" };
            }

            return {
                ...state,
                tag_search: temp_value
            };
        }

        case "UPDATE_MOBILE_NUMBER_SEARCH": {
            return {
                ...state,
                mobile_number_search: value
            };
        }

        case "UPDATE_NAME_SEARCH": {
            let temp_value = value;
            if (temp_value === null) {
                temp_value = "";
            }

            return {
                ...state,
                name_search: temp_value
            };
        }

        case "UPDATE_ALL_DATA":
            return { ...value };

        case "RESET":
            return { ...initial_state };

        default: return { ...state };
    }
}

export function CommsProvider ({ children }) {
    const [contacts, setContacts] = useState([]);
    const [search_state, search_dispatch] = useReducer(reducer, initial_state);
    
    useEffect(() => {
        receiveAllContacts(data => setContacts(data));

        return () => { removeReceiveAllContacts(); };
    }, []);

    const value = { contacts, search_state, search_dispatch };
    return <CommsContext.Provider value={value}>
        {children}
    </CommsContext.Provider>;
}