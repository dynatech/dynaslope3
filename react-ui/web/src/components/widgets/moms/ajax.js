import axios from "axios";
import { host } from "../../../config";


export function insertMomsToDB (moms_list, callback) {
    const api_link = `${host}/api/manifestations_of_movement/write_monitoring_moms_to_db`;

    console.log("moms_list", moms_list);

    axios.post(api_link, moms_list)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            console.log("Moms Insert result", data);
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}

export function getMOMsFeatures (site_code, callback) {
    const api_link = `${host}/api/manifestations_of_movement/get_moms_features/${site_code}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("MOMs Features", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}