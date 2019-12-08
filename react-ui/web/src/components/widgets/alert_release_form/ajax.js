import axios from "axios";
import moment from "moment";
import { host } from "../../../config";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
// Session Stuff
import { getCurrentUser } from "../../sessions/auth";
import { makePOSTAxiosRequest, makeGETAxiosRequest } from "../../../UtilityFunctions";


export function handleDelete (json_data, callback) {
    const api_link = `${host}/api/issues_and_reminders/delete_narratives_from_db`;
    makePOSTAxiosRequest(json_data, api_link, callback);
}


// eslint-disable-next-line import/prefer-default-export
export function buildInternalAlertLevel (json_data, callback) {
    console.log("json_data", json_data);

    // Make an API request
    const api_link = `${host}/api/monitoring/build_internal_alert_level`;
    makePOSTAxiosRequest(json_data, api_link, callback);
}


export function getMonitoringReleaseByDataTS (site_code, data_ts, callback) {
    const api_link = `${host}/api/monitoring/get_monitoring_releases_by_data_ts/${site_code}/${data_ts}`;
    makeGETAxiosRequest(api_link, callback);
}


// eslint-disable-next-line import/prefer-default-export
export function getInternalAlertLevel (input, callback) {
    const {
        site_id
    } = input;

    let api_link = `${host}/api/monitoring/get_site_alert_details`;
    api_link += `?site_id=${site_id}`;

    makeGETAxiosRequest(api_link, callback);

}
