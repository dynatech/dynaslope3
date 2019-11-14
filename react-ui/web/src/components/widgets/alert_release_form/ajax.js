import axios from "axios";
import moment from "moment";
import { host } from "../../../config";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
// Session Stuff
import { getCurrentUser } from "../../sessions/auth";

function makeAxiosRequest (json_data, api_link, callback = null) {
    axios.post(api_link, json_data)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}

export function handleDelete (json_data, callback) {
    const api_link = `${host}/api/issues_and_reminders/delete_narratives_from_db`;
    makeAxiosRequest(json_data, api_link, callback);
}


// eslint-disable-next-line import/prefer-default-export
export function buildInternalAlertLevel (json_data, callback) {
    console.log("json_data", json_data);

    // Make an API request
    const api_link = `${host}/api/monitoring/build_internal_alert_level`;
    makeAxiosRequest(json_data, api_link, callback);
}


// eslint-disable-next-line import/prefer-default-export
export function getInternalAlertLevel (input, callback) {
    const {
        site_id
    } = input;

    let api_link = `${host}/api/monitoring/get_site_internal_alert`;
    api_link += `?site_id=${site_id}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });

}
