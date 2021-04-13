import axios from "axios";
import { host } from "../../../config";
import { makeGETAxiosRequest } from "../../../UtilityFunctions";

export function getBulletinEmailDetails (release_id, callback) {
    const api_link = `${host}/api/bulletin_email/get_bulletin_email_details/${release_id}`;
    makeGETAxiosRequest(api_link, callback);
}

export async function downloadBulletin (release_id, callback) {
    const api_link = `${host}/api/bulletin/download_bulletin/${release_id}`;
    axios.get(api_link, { responseType: "blob" })
    .then((response) => {
        const { data } = response;
        callback(data);
    })
    .catch((error) => {
        console.log(error);
    });
}

export function getBulletinDetails (release_id, callback) {
    const api_link = `${host}/api/monitoring/create_bulletin/${release_id}`;

    axios.get(api_link)
    .then((response) => {
        const { data } = response;
        console.log("Bulletin details", data);
        callback(data);
    })
    .catch((error) => {
        console.log(error);
    });
}
