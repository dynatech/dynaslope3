import axios from "axios";
import { host } from "../../../config";
import { makeGETAxiosRequest, makePOSTAxiosRequest } from "../../../UtilityFunctions";


export function write_bulletin_narrative (payload, callback) {
    const api_link = `${host}/api/narratives/write_narratives_to_db`;

    makePOSTAxiosRequest(api_link, callback, payload);
}


export function getBulletinEmailDetails (release_id, callback) {
    const api_link = `${host}/api/bulletin_email/get_bulletin_email_details/${release_id}`;

    makeGETAxiosRequest(api_link, callback);
}


export function downloadBulletin (release_id, callback) {
    const api_link = `${host}/api/bulletin/download_bulletin/${release_id}`;

    makeGETAxiosRequest(api_link, callback);
}

export function getBulletinDetails (release_id, callback) {
    const api_link = `${host}/api/monitoring/create_bulletin/${release_id}`;

    axios.get(api_link)
    .then((response) => {
        const { data } = response;
        console.log("Bulletin data", data);
        callback(data);
    })
    .catch((error) => {
        console.log(error);
    });
}
