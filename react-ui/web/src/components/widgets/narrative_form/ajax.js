import axios from "axios";
import host from "../../../config";


export function handleNarratives (json_data) {
    const api_link = `${host}/api/narratives/write_narratives_to_db`;
    axios.post(api_link, json_data)
    .then((response) => {
        console.log(response);
    })
    .catch((error) => {
        console.log(error);
    });
}


// eslint-disable-next-line import/prefer-default-export
export function getEndOfShiftReports (input, callback) {
    console.log("JUST A PLACEHOLDER");
}
