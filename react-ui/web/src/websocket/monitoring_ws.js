import io from "socket.io-client";
import { host } from "../config";

let socket;

function connectToWebsocket () {
    if (typeof socket === "undefined") {
        socket = io(`${host}/monitoring`);
    }
}

export function subscribeToWebSocket (socket_fns) {
    connectToWebsocket();

    // socket.on("receive_generated_alerts", data => socket_fns.receive_generated_alerts(null, data));
    // socket.on("receive_candidate_alerts", data => socket_fns.receive_candidate_alerts(null, data));
    // socket.on("receive_alerts_from_db", data => socket_fns.receive_alerts_from_db(null, data));
    // socket.on("receive_issues_and_reminders", data => { console.log("Kinuha ko dito"); });
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
        // console.log(data);
        callback(data);
    });
}

export function receiveCandidateAlerts (callback) {
    connectToWebsocket();

    socket.on("receive_candidate_alerts", data => {
        // console.log(data);
        callback(data);
    });
}

export function receiveAlertsFromDB (callback) {
    connectToWebsocket();

    socket.on("receive_alerts_from_db", data => {
        // console.log(data);    
        callback(data);
    });
}
