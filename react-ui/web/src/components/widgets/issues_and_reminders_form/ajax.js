import axios from "axios";
import moment from "moment";
import { host } from "../../../config";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

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


export function handleIssuesAndReminders (json_data, callback) {
    const temp = json_data;
    const { ts_posted, ts_posted_until, site_id_list } = json_data;
    const temp_list = [];
    if (site_id_list !== null) {
        site_id_list.forEach(({ value }) => {
            // Value is site_id
            temp_list.push(value);
        });
    }
    temp.ts_posted = moment(ts_posted).format("YYYY-MM-DD HH:mm:ss");
    temp.ts_posted_until = moment(ts_posted_until).format("YYYY-MM-DD HH:mm:ss");
    temp.site_id_list = temp_list;

    sendWSMessage("write_issues_and_reminders", temp);
    // const api_link = `${host}/api/issues_and_reminders/write_issue_reminder_to_db`;
    // makeAxiosRequest(temp, api_link, callback);
}


// eslint-disable-next-line import/prefer-default-export
export function getIssuesAndReminders (input, callback) {
    const {
        include_count, limit, offset,
        filters, search_str, include_expired
    } = input;

    let api_link = `${host}/api/issues_and_reminders/get_issues_and_reminders`;
    api_link += `?include_expired=${include_expired}`;

    if (limit !== null || offset !== null) {
        api_link += `&limit=${limit}&offset=${offset}`;

        if (include_count) api_link += "&include_count=true";
        if (filters.length !== 0) {
            const filter_str = filters.map(row => {
                const { name, data } = row;
                return data.map(x => `&${name}=${x}`).join("");
            });
    
            api_link += filter_str.join("");
        }    
        if (search_str !== "") api_link += `&search=${search_str}`;    
    }

    console.log(api_link);

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });

}
