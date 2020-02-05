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

function getServerTime () {
    connectToWebsocket();

    socket.emit("get_server_time");
}

function receiveServerTime (callback) {
    socket.on("receive_server_time", data => {
        callback(data);
    });
}

export { connectToWebsocket, getServerTime, receiveServerTime };