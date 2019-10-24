import io from "socket.io-client";
import { host } from "../config";

let socket;

export function subscribeToWebSocket (socket_fns) {
    socket = io(`${host}/monitoring`);
    socket.on("receive_generated_alerts", data => socket_fns.receive_generated_alerts(null, data));
    socket.on("receive_candidate_alerts", data => socket_fns.receive_candidate_alerts(null, data));
    socket.on("receive_alerts_from_db", data => socket_fns.receive_alerts_from_db(null, data));
    // socket.on("receive_issues_and_reminders", data => socket_fns.receive_issues_and_reminders(null, data));
}


export function sendWSMessage (key, data) {
    console.log("KEY:", key);
    console.log("DATA:", data);
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


export function receiveIssuesAndReminders (callback) {
    socket.on("receive_issues_and_reminders", data => {
        console.log(data);    
        callback(data);
    });
}
