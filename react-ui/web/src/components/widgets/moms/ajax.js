import axios from "axios";


const host = "http://192.168.150.167:5000";


export default function getMOMsFeatures (site_code, callback) {
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