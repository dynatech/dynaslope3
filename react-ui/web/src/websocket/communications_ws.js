import io from "socket.io-client";
import { host } from "../config";

let socket;

function subscribeToWebSocket (callback, page = "chatterbox") {
    socket = io(`${host}/communications`, {
        reconnectionDelay: 10000,
        // transports: ["websocket"]
    });

    if (page === "chatterbox")
        socket.on("receive_latest_messages", data => {
            console.log("Latest messages", data);
            callback(data);
        });
    else if (page === "contacts")
        socket.on("receive_all_contacts", data => {
            console.log("All Contacts", data);
            callback(data);
        });
}

function receiveMobileIDRoomUpdate (callback) {
    socket.on("receive_mobile_id_room_update", data => {
        console.log("Mobile ID Room Update", data);
        callback(data);
    });
}

function removeReceiveMobileIDRoomUpdateListener () {
    socket.removeListener("receive_mobile_id_room_update");
}

function sendMessageToDB (data, callback) {
    socket.emit("send_message_to_db", data, ret => {
        if (typeof callback !== "undefined")
            callback(ret);
    });
}

// function receiveAllContacts (callback) {
//     socket.on("receive_all_contacts", data => {
//         console.log("All Contacts", data);
//         callback(data);
//     });
// }

function unsubscribeToWebSocket () {
    socket.close();
}


export {
    socket, subscribeToWebSocket, unsubscribeToWebSocket, 
    receiveMobileIDRoomUpdate, removeReceiveMobileIDRoomUpdateListener,
    sendMessageToDB, // receiveAllContacts
};