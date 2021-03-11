import axios from "axios";
import { host } from "../../../config";


export function insertOnDemandToDb (on_demand_data, callback) {
    const api_link = `${host}/api/monitoring/save_on_demand_data`;

    console.log("on_demand_data", on_demand_data);

    axios.post(api_link, on_demand_data)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            console.log("On Demand Insert result", data);
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}