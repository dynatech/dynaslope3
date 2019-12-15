import io from "socket.io-client";
import { host } from "../config";

let socket;

function connectToWebsocket () {
    if (typeof socket === "undefined" || socket === null) {
        socket = io(`${host}/communications`, {
            reconnectionDelay: 10000,
            reconnectionAttempts: 30,
            transports: ["websocket"]
        });
    }
}

function subscribeToWebSocket (page) {
    connectToWebsocket();

    if (page === "chatterbox") {
        socket.emit("get_latest_messages");
        socket.emit("get_all_mobile_numbers");
    } else if (page === "contacts") {
        socket.emit("get_all_contacts");
    }
}

function receiveLatestMessages (callback) {
    connectToWebsocket();

    socket.on("receive_latest_messages", data => {
        console.log("Latest messages", data);
        callback(data);
    });
}

function removeReceiveLatestMessages () {
    socket.removeListener("receive_latest_messages");
}

function receiveAllContacts (callback) {
    connectToWebsocket();

    socket.on("receive_all_contacts", data => {
        console.log("All Contacts", data);
        callback(data);
    });
}

function removeReceiveAllContacts () {
    socket.removeListener("receive_all_contacts");
}

function receiveMobileIDRoomUpdate (callback) {
    connectToWebsocket();

    socket.on("receive_mobile_id_room_update", data => {
        console.log("Mobile ID Room Update", data);
        callback(data);
    });
}

function receiveAllMobileNumbers (callback) {
    connectToWebsocket();

    socket.on("receive_all_mobile_numbers", data => {
        console.log("All Saved Mobile Numbers", data);
        callback(data);
    });
}

function removeReceiveMobileIDRoomUpdateListener () {
    socket.removeListener("receive_mobile_id_room_update");
}

function receiveSearchResults (callback) {
    socket.on("receive_search_results", data => {
        console.log("Chatterbox Search Results", data);
        callback(data);
    });
}

function removeReceiveSearchResults () {
    socket.removeListener("receive_search_results");
}

function sendMessageToDB (data, callback) {
    socket.emit("send_message_to_db", data, ret => {
        if (typeof callback !== "undefined")
            callback(ret);
    });
}

function unsubscribeToWebSocket () {
    socket.close();
}


export {
    socket, subscribeToWebSocket, unsubscribeToWebSocket, 
    receiveMobileIDRoomUpdate, removeReceiveMobileIDRoomUpdateListener,
    sendMessageToDB, receiveSearchResults, removeReceiveSearchResults,
    receiveAllMobileNumbers, receiveLatestMessages, receiveAllContacts,
    removeReceiveAllContacts, removeReceiveLatestMessages
};