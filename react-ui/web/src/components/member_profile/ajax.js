import axios from "axios";
import { host } from "../../config";

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

function CreateDynaMember (json_data, callback) {
    const api_link = `${host}/api/users/create_dynaslope_user`;
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
export { updateUserCredentials, updateUserInfo, CreateDynaMember };