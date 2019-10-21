import axios from "axios";
import host from "../../config";

export function getSession (access_token, callback) {
    const api_link = `${host}/api/check_session`;

    axios.get(api_link, {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    })
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function refreshSession (refresh_token, callback) {
    const api_link = `${host}/api/refresh_session`;

    axios.get(api_link, {
        headers: {
            Authorization: `Bearer ${refresh_token}`
        }
    })
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function loginUser (payload, callback) {
    const api_link = `${host}/api/login`;

    axios.post(api_link, payload)
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}