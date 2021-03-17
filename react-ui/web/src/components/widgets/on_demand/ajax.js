import axios from "axios";
import { host } from "../../../config";
import { makeGETAxiosRequest } from "../../../UtilityFunctions";

// eslint-disable-next-line import/prefer-default-export
export function insertOnDemandToDb (on_demand_data, callback) {
    const api_link = `${host}/api/monitoring/save_on_demand_data`;

    axios.post(api_link, on_demand_data)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            console.log("On Demand Insert result", data);
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}

export function checkLatestSiteEventIfHasOnDemand (site_id, callback) {
    const api_link = `${host}/api/monitoring/check_if_current_site_event_has_on_demand/${site_id}`;
    makeGETAxiosRequest(api_link, callback);
}