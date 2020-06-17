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

export function attachMobileNumberToExistingUser (input, callback) {
    const api_link = `${host}/api/contacts/attach_mobile_number_to_existing_user`;
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

export function getRainInformation (input, callback) {
    const api_link = `${host}/api/rainfall/get_all_site_rainfall_data`;
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Get rain information data reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function sendRoutineEwiMessage (payload, callback, error_callback) {
    const api_link = `${host}/api/chatterbox/send_routine_ewi_sms`;

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

export function getBlockedContacts (callback) {
    const api_link = `${host}/api/contacts/blocked_numbers`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function saveBlockedContact (input, callback) {
    const api_link = `${host}/api/contacts/save_block_number`;
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save blocked contact data reponse", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSimPrefixes (callback) {
    const api_link = `${host}/api/contacts/sim_prefix`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function loadMoreMessages (mobile_id, batch, callback) {
    const api_link = `${host}/api/chatterbox/load_more_messages/${mobile_id}/${batch}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Additional loaded messages", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSiteStakeHolders (callback) {
    const api_link = `${host}/api/contacts/get_contact_prioritization`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("All Sites Stakeholders", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function saveUpdatedPrimaryContact (input, callback = null) {
    const api_link = `${host}/api/contacts/save_primary_contact`;
    
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save updated primary contact", data);
        if (callback !== null)
            callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function resendMessage (outbox_status_id, callback) {
    const api_link = `${host}/api/chatterbox/resend_message/${outbox_status_id}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Resend message", data);
        if (typeof callback !== "undefined") callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}
