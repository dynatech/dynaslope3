
import { host } from "../../../config";
import { makePOSTAxiosRequest, makeGETAxiosRequest } from "../../../UtilityFunctions";

export function handleDelete (json_data, callback) {
    const api_link = `${host}/api/issues_and_reminders/delete_narratives_from_db`;
    makePOSTAxiosRequest(api_link, json_data, callback);
}

export function createReleaseDetails (json_data, callback) {
    // Make an API request
    const api_link = `${host}/api/monitoring/create_release_details`;
    makePOSTAxiosRequest(api_link, json_data, callback);
}

export function getMonitoringReleaseByDataTS (site_code, data_ts, callback) {
    const api_link = `${host}/api/monitoring/get_monitoring_releases_by_data_ts/${site_code}/${data_ts}`;
    makeGETAxiosRequest(api_link, callback);
}

export function getLatestSiteRelease (input, callback) {
    const {
        site_id
    } = input;

    let api_link = `${host}/api/monitoring/get_site_alert_details`;
    api_link += `?site_id=${site_id}`;

    makeGETAxiosRequest(api_link, callback);

}

export function getUnreleasedRoutineSites (data_timestamp, callback) {
    const ts = "2020-02-04 11:30:00";
    const api_link = `${host}/api/monitoring/get_unreleased_routine_sites/${data_timestamp}`;
    
    makeGETAxiosRequest(api_link, callback);
}
