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

export function getEWISMSRecipients (site_code, callback) {
    const api_link = `${host}/api/contacts/get_contacts_per_site/${site_code}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(response);
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function sendMessage (payload, callback, error_callback) {
    const api_link = `${host}/api/chatterbox/send_message`;

    axios.post(api_link, payload)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
        error_callback(error);
    });
}

export function writeEwiNarrativeToDB (payload, callback) {
    const api_link = `${host}/api/narratives/write_narratives_to_db`;

    axios.post(api_link, payload)
    .then(response => {
        const { data } = response;
        console.log("EWI SMS reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getEwiSMSNarrative (release_id, callback) {
    const api_link = `${host}/api/chatterbox/get_ewi_sms_narrative/${release_id}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("EWI recipients", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getRecipientsList (payload, callback) {
    const api_link = `${host}/api/contacts/get_recipients_option`;

    axios.post(api_link, payload)
    .then(response => {
        const { data } = response;
        console.log("Selected recipients", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}