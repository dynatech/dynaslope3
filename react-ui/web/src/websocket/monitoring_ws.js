import io from "socket.io-client";
import { host } from "../config";

let socket;

function connectToWebsocket () {
    if (typeof socket === "undefined" || socket === null) {
        socket = io(`${host}/monitoring`);
    }
}

export function subscribeToWebSocket (socket_fns) {
    connectToWebsocket();
}

export function sendWSMessage (key, data) {
    console.log("Payload: { key: data }", key, data);
    const payload = {
        data,
        key
    };
    socket.send(payload);
}

export function onWSMessage (message) {
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
        // console.log(data);    
        callback(data);
    });
}

export function receiveGeneratedAlerts (callback) {
    connectToWebsocket();

    socket.on("receive_generated_alerts", data => {
        const temp = JSON.parse(data);
        console.log("Generated alerts", temp);
        callback(temp);
    });
}

export function receiveCandidateAlerts (callback) {
    connectToWebsocket();

    socket.on("receive_candidate_alerts", data => {
        const temp = JSON.parse(data);
        console.log("Candidate alerts", temp);
        callback(temp);
    });
}

export function receiveAlertsFromDB (callback) {
    connectToWebsocket();

    socket.on("receive_alerts_from_db", data => {
        const temp = JSON.parse(data);
        console.log("Alerts from database", temp);    
        callback(temp);
    });
}
