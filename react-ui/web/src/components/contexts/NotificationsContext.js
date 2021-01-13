/* eslint-disable no-case-declarations */

import React, {
    useEffect, useReducer, createContext
} from "react";

import moment from "moment";

import { getUserNotifications, receiveUserNotifications } from "../../websocket/misc_ws";
import { setAllUnseenNotifications, updateTSRead } from "../widgets/notifications/ajax";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    function reducer (state, payload) {
        const { action, data } = payload;
        const { notifications } = state;
        switch (action) {
            case "INSERT":
                return { ...data };
            case "UPDATE_COUNT":
                return { ...state, count: data };
            case "UPDATE_NOTIFICATION":
                const { notification_id, value } = data;
                const temp = [...notifications];
                const index = temp.findIndex(row => row.notification_id === notification_id);
                temp[index].ts_read = value;
                return { ...state, notifications: temp };
            default:
                return state;
        }
    }
    const [notifications_object, setNotificationsObject] = useReducer(reducer, { notifications: [], count: 0 });
    useEffect(() => {
        getUserNotifications();
        receiveUserNotifications(data => setNotificationsObject({ action: "INSERT", data }));
    }, []);

    function setNotificationCountToZero (user_id) {
        setNotificationsObject({ action: "UPDATE_COUNT", data: 0 });
        setAllUnseenNotifications(user_id);
        receiveUserNotifications(data => setNotificationsObject({ action: "INSERT", data }));
    }

    function toggleReadTS (user_id, notification_id, toggle_to) {
        const value = toggle_to === "read" ? moment().format("YYYY-MM-DD HH:mm:ss") : null;
        setNotificationsObject({ action: "UPDATE_NOTIFICATION", data: { notification_id, value } });
        updateTSRead(user_id, notification_id, value);
    }

    const return_obj = {
        notifications_object,
        setNotificationsObject,
        setNotificationCountToZero,
        toggleReadTS,
        getUserNotifications
    };

    return (
        <NotificationsContext.Provider value={return_obj}>
            {children}
        </NotificationsContext.Provider>
    );
};