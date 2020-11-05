import io from "socket.io-client";
import { host } from "../config";

let socket;

function connectToWebsocket () {
    if (typeof socket === "undefined" || socket === null) {
        socket = io(`${host}/misc`, {
            reconnectionDelay: 10000,
            reconnectionAttempts: 30,
            transports: ["websocket"]
        });
    }

}

function subscribeToMiscWebSocket (reconnect_callback) {
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

function unsubscribeToWebSocket () {
    socket.close();
    socket = null;
}

function getServerTime () {
    connectToWebsocket();
    socket.emit("get_server_time");
}

function receiveServerTime (callback) {
    socket.on("receive_server_time", data => {
        callback(data);
    });
}

function getMonitoringShifts () {
    connectToWebsocket();
    socket.emit("get_monitoring_shifts");
}

function receiveMonitoringShiftData (callback) {
    connectToWebsocket();
    socket.on("receive_monitoring_shifts", data => {
        const temp = JSON.parse(data);
        console.log("Monitoring Shifts:", temp);
        callback(temp);
    });
}

function removeReceiveMonitoringShiftData () {
    socket.removeListener("receive_monitoring_shifts");
}

export { 
    subscribeToMiscWebSocket,
    unsubscribeToWebSocket,
    connectToWebsocket, 
    getServerTime, 
    receiveServerTime, 
    receiveMonitoringShiftData,
    getMonitoringShifts,
    removeReceiveMonitoringShiftData
};
    