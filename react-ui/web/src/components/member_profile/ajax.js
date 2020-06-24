import axios from "axios";
import { host } from "../../config";

function getDynaslopeUsers (callback) {
    const api_link = `${host}/api/users/get_dynaslope_users`;
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
export { getDynaslopeUsers };