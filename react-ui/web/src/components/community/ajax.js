import axios from "axios";
import { host } from "../../config";


export function getCommunityStaff (site_code, callback) {
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

export function getAllSites (input, callback) {
    axios.get(`${host}/api/sites/get_sites_data`)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.log(error);
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