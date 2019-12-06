import axios from "axios";
import { host } from "../../../config";

export function sendEmail (input, callback) {
    const api_link = `${host}/api/emails/send_email`;
    console.log(input);
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Send email response", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}


export function sendBulletinEmail (input, callback) {
    const api_link = `${host}/api/emails/send_email`;
    console.log(input);
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Send email response", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

