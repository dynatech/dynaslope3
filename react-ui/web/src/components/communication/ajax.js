import axios from "axios";
import { host } from "../../config";

export function getListOfMunicipalities (callback) {
    const api_link = `${host}/api/sites/get_all_geographical_selection_per_category/municipality?include_inactive=false`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function saveContact (input, callback) {
    const api_link = `${host}/api/contacts/save_contact`;
    console.log(input);
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save contact data reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}
