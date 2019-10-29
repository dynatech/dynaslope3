import axios from "axios";
import { host } from "../../config";


//
// TEMPLATE
//
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


export function getShiftData (input, callback) {
    const api_link = `${host}/api/shift_checker/get_shift_data`;
    makeAxiosRequest(input, api_link, callback);
}

export function getEndOfShiftReports (input, callback) {
    const {
        shift_start
    } = input;

    const api_link = `${host}/api/end_of_shift/get_end_of_shift_reports/${shift_start}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
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
        // console.log("Events", data);
        // setIsLoading(false);
        // final_data = prepareEventsArray(response.data);
        // setData(final_data);
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
        callback(data);
    })
    .catch(error => {
        console.error("Problem in getEventTimelineEntries Axios request");
        console.error(error);
    });    
}




