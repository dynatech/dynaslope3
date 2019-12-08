import axios from "axios";
import { func } from "prop-types";
import { host } from "../../config";
import { makeGETAxiosRequest, makePOSTAxiosRequest } from "../../UtilityFunctions";


export function getEOSDetails (event_id, shift_ts_end, callback) {
    const api_link = `${host}/api/end_of_shift/get_eos_email_details/${event_id}/${shift_ts_end}`;
    makeGETAxiosRequest(api_link, callback);
}

export function getShiftData (input, callback) {
    const api_link = `${host}/api/shift_checker/get_shift_data`;
    makePOSTAxiosRequest(input, api_link, callback);
}

export function getEndOfShiftReports (input, callback) {
    const {
        shift_start
    } = input;

    const api_link = `${host}/api/end_of_shift/get_end_of_shift_reports/${shift_start}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("EOS Data", data);
        callback(data);
    })
    .catch(error => {
        console.error("Problem in Axios request");
        console.error(error);
    });
}

export function getNarratives (input, callback) {
    const {
        include_count, limit, offset,
        filters, search_str
    } = input;

    let api_link = `${host}/api/narratives/get_narratives?limit=${limit}&offset=${offset}`;

    if (include_count) api_link += "&include_count=true";

    if (filters.length !== 0) {
        const filter_str = filters.map(row => {
            const { name, data } = row;
            return data.map(x => `&${name}=${x}`).join("");
        });

        api_link += filter_str.join("");
    }

    if (search_str !== "") api_link += `&search=${search_str}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getMonitoringEvents (input, callback) {
    const {
        limit, offset, include_count,
        filters, search_str
    } = input;

    let api_link = `${host}/api/monitoring/get_monitoring_events?filter_type=complete&offset=${offset}&limit=${limit}`;
    
    if (include_count) api_link += "&include_count=true";

    if (filters.length > 0) {
        const filter_str = filters.map(row => {
            const { name, data } = row;
            return data.map(x => `&${name}=${x}`).join("");
        });

        api_link += filter_str.join("");
    }

    if (search_str !== "") api_link += `&search=${search_str}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.log(error);
    });    
}

export function getEventTimelineEntries (input, callback) {
    const {
        event_id
    } = input;

    const api_link = `${host}/api/monitoring/get_event_timeline_data/${event_id}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Event details", data);
        callback(data);
    })
    .catch(error => {
        console.error("Problem in getEventTimelineEntries Axios request");
        console.error(error);
    });    
}

export function getEWIMessage (release_id, callback) {
    const api_link = `${host}/api/chatterbox/get_ewi_message/${release_id}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSites (input, callback) {
    let api_link = `${host}/api/sites/get_sites_data`;
    if (typeof input !== "undefined" && input !== "" && input !== null && input.length !== 0) {
        api_link += `/${input}`;
    }
    makeGETAxiosRequest(api_link, callback);
}

export function saveEOSDataAnalysis (json_data, callback) {
    const api_link = `${host}/api/end_of_shift/save_eos_data_analysis`;
    makePOSTAxiosRequest(api_link, callback, json_data);
}

export function downloadEosCharts (json_data, callback) {
    const api_link = `${host}/api/end_of_shift/download_eos_charts`;
    makePOSTAxiosRequest(api_link, callback, json_data);
}

export function getBulletinEmailDetails (release_id, callback) {
    const api_link = `${host}/api/monitoring/get_eos_subject/${release_id}`;

    makeGETAxiosRequest(api_link, callback);
}
