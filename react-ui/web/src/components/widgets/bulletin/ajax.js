import axios from "axios";
import { host } from "../../../config";

// function makeAxiosRequest (api_link, callback = null, payload) {
//     axios.post(api_link, payload)
//     .then((response) => {
//         const { data } = response; 
//         if (callback !== null) {
//             callback(data);
//         } 
//     })
//     .catch((error) => {
//         console.log(error);
//     });
// }

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
