import { host } from "../../config";
import { makeGETAxiosRequest } from "../../UtilityFunctions";

export function getFolders (callback) {
    const api_link = `${host}/api/knowledge/get_folders`;
    makeGETAxiosRequest(api_link, callback);
}

export function getFiles (callback) {
    const api_link = `${host}/api/sites/get_sites_data?include_inactive=true`;
    makeGETAxiosRequest(api_link, callback);
}