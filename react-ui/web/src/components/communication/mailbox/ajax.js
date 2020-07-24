import axios from "axios";
import { host } from "../../../config";
import { makePOSTAxiosRequest } from "../../../UtilityFunctions";

export function sendEmail (input, callback) {
    const api_link = `${host}/api/mailbox/send_email`;
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


export function sendBulletinEmail (input, callback, err) {
    const api_link = `${host}/api/mailbox/send_bulletin_email`;
    makePOSTAxiosRequest(api_link, input, callback, err);
}

export function sendEOSEmail (json_data, callback, err) {
    const api_link = `${host}/api/mailbox/send_eos_email`;
    makePOSTAxiosRequest(api_link, json_data, callback, err);
}

export function uploadTempFile (data, callback, err) {
    const api_link = `${host}/api/mailbox/upload_temp`;
    makePOSTAxiosRequest(api_link, data, callback, err);
}
