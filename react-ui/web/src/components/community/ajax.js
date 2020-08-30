import axios from "axios";
import { host } from "../../config";


export function getCommunityStakeholders (site_code, callback) {
    axios.get(`${host}/api/users/get_community_orgs_by_site/${site_code}`)
    .then(response => {
        const { data } = response;
        callback(data);
    });
}

export function getSiteSummary (site_id, callback) {
    axios.get(`${host}/api/monitoring/get_current_monitoring_summary_per_site/${site_id}`)
    .then(response => {
        const { data } = response;
        callback(data);
    });
}

export function getSiteSeason (site_code, callback) {
    axios.get(`${host}/api/sites/get_site_season/${site_code}`)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.log(error);
    });
}

export function getSeasons (callback) {
    axios.get(`${host}/api/sites/get_seasons`)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.log(error);
    });
}

export function saveSiteInformation (input, callback) {
    const api_link = `${host}/api/sites/save_site_information`;
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save site info data reponse", data);
    })
    .catch(error => {
        console.error(error);
    });
}


export function saveDeploymentLogs (input, callback) {
    const api_link = `${host}/api/deployment_logs/save_deployment_logs`;
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save deployment logs reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getLoggersData (callback) {
    axios.get(`${host}/api/deployment_logs/get_loggers_data`)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.log(error);
    });
}

export function saveDataUpdate (input, callback) {
    const api_link = `${host}/api/deployment_logs/save_data_update`;
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save data update reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}
