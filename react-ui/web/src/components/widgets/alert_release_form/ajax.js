
import { host } from "../../../config";
import { makePOSTAxiosRequest, makeGETAxiosRequest } from "../../../UtilityFunctions";

export function handleDelete (json_data, callback) {
    const api_link = `${host}/api/issues_and_reminders/delete_narratives_from_db`;
    makePOSTAxiosRequest(api_link, json_data, callback);
}

export function getLatestSiteEventDetails (site_id, callback) {
    const api_link = `${host}/api/monitoring/get_latest_site_event_details/${site_id}`;
    makeGETAxiosRequest(api_link, callback);
}

export function processReleaseInternalAlert (json_data, callback) {
    const api_link = `${host}/api/monitoring/process_release_internal_alert`;
    makePOSTAxiosRequest(api_link, json_data, callback);
}

export function getUnreleasedRoutineSites (data_timestamp, callback) {
    const api_link = `${host}/api/monitoring/get_unreleased_routine_sites/${data_timestamp}`;
    makeGETAxiosRequest(api_link, callback);
}
