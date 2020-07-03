import axios from "axios";
import { host } from "../../config";

function getDynaslopeUsers (callback) {
    const api_link = `${host}/api/users/get_dynaslope_users/true/true`;
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

function updateUserCredentials (json_data, callback) {
    const api_link = `${host}/api/users/update_account`;
    axios.post(api_link, json_data)
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

function updateUserInfo (json_data, callback) {
    const api_link = `${host}/api/users/update_user_info`;
    axios.post(api_link, json_data)
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}
export { getDynaslopeUsers, updateUserCredentials, updateUserInfo };