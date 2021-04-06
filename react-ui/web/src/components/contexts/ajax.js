import { host } from "../../config";
import { makeGETAxiosRequest } from "../../UtilityFunctions";


export function getSites (callback) {
    const api_link = `${host}/api/sites/get_sites_data?include_inactive=true`;
    makeGETAxiosRequest(api_link, callback);
}

export function getUsers (callback) {
    const api_link = `${host}/api/users/get_dynaslope_users/true/true`;
    makeGETAxiosRequest(api_link, callback);
}

export function getOrganizations (callback) {
    const api_link = `${host}/api/users/get_organizations`;
    makeGETAxiosRequest(api_link, callback);
}

export function getUserByNickname (nickname, callback) {
    const api_link = `${host}/api/users/get_user_by_nickname/${nickname}`;
    makeGETAxiosRequest(api_link, callback);
}

