import io from "socket.io-client";
import { host } from "../config";

let socket;

function connectToWebsocket () {
    if (typeof socket === "undefined" || socket === null) {
        socket = io(`${host}/monitoring`, {
            reconnectionDelay: 10000,
            reconnectionAttempts: 30,
            transports: ["websocket"]
        });
    }
}

export function subscribeToWebSocket (reconnect_callback) {
    connectToWebsocket();

    socket.on("reconnecting", () => {
        reconnect_callback(true);
    });

    socket.on("reconnect", () => {
        reconnect_callback(false);
    });

    socket.on("reconnect_failed", () => {
        // reconnect_callback(false);
        console.log("failed");
    });
}

export function sendWSMessage (key, data = null) {
    connectToWebsocket();
    console.log("Payload: { key: data }", key, data);
    const payload = {
        data,
        key
    };
    socket.send(payload);
}

export function onWSMessage (message) {
    connectToWebsocket();
    
    socket.on("message", (msg) => {
        console.log(msg);
    });
}

export function unsubscribeToWebSocket () {
    socket.close();
    socket = null;
}

// Receiver Callback Functions
export function receiveIssuesAndReminders (callback) {
    connectToWebsocket();

    socket.on("receive_issues_and_reminders", data => {
        const temp = JSON.parse(data);
        callback(temp);
    });
}

export function receiveGeneratedAlerts (callback) {
    connectToWebsocket();

    socket.on("receive_generated_alerts", data => {
        const temp = JSON.parse(data);
        console.log("Generated alerts: ", temp);
        callback(temp);
    });
}

export function receiveCandidateAlerts (callback) {
    connectToWebsocket();

    socket.on("receive_candidate_alerts", data => {
        const temp = JSON.parse(data);
        console.log("Candidate alerts: ", temp);
        callback(temp);
    });
}

export function receiveAlertsFromDB (callback) {
    connectToWebsocket();

    socket.on("receive_alerts_from_db", data => {
        const temp = JSON.parse(data);
        console.log("Alerts from DB: ", temp);
        callback(temp);
    });
}

export function receiveAllSiteRainfallData (callback) {
    connectToWebsocket();

    socket.on("receive_rainfall_data", data => {
        const temp = JSON.parse(data);
        console.log("All Site Rainfall Data: ", temp);
        callback(temp);
    });
}
