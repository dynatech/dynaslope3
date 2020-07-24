import axios from "axios";
import moment from "moment";
import { host } from "../../../config";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
// Session Stuff
import { getCurrentUser } from "../../sessions/auth";

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

export function handleIssuesAndReminders (json_data) {
    const temp = json_data;
    const { ts_posted, ts_expiration, site_id_list } = json_data;
    const temp_list = [];
    if (site_id_list !== null) {
        site_id_list.forEach(({ value }) => {
            // Value is site_id
            temp_list.push(value);
        });
    }
    temp.user_id = getCurrentUser().user_id;
    temp.ts_posted = moment(ts_posted).format("YYYY-MM-DD HH:mm:ss");
    if (ts_expiration !== "Invalid date") temp.ts_expiration = moment(ts_expiration).format("YYYY-MM-DD HH:mm:ss");
    temp.site_id_list = temp_list;

    return temp;
}

export function insertIssuesAndRemindersViaWS (json_data) {
    const data = handleIssuesAndReminders(json_data);
    sendWSMessage("write_issues_and_reminders", data);
}

export function insertIssuesAndRemindersViaPost (json_data, callback) {
    const data = handleIssuesAndReminders(json_data);
    const api_link = `${host}/api/issues_and_reminders/write_issue_reminder_to_db`;
    makeAxiosRequest(data, api_link, callback);

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

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });

}
