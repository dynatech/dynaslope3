import axios from "axios";
import host from "../../../config";

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
    const api_link = `${host}/api/narratives/delete_narratives_from_db`;
    makeAxiosRequest(json_data, api_link, callback);
}


export function handleNarratives (json_data, callback) {
    const api_link = `${host}/api/narratives/write_narratives_to_db`;
    makeAxiosRequest(json_data, api_link, callback);
}

// eslint-disable-next-line import/prefer-default-export
export function getEndOfShiftReports (input, callback) {
    console.log("JUST A PLACEHOLDER");
}
