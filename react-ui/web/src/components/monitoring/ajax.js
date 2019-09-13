import axios from "axios";
import host from "../../config";

// eslint-disable-next-line import/prefer-default-export
export function getNarratives (input, callback) {
    const {
        include_count, limit, offset,
        filters, search_str
    } = input;

    let api_link = `${host}/api/narratives/get_narratives?limit=${limit}&offset=${offset}`;

    if (include_count) api_link += "&include_count=true";

    if (filters.length !== 0) {
        const filter_str = filters.map(row => {
            const { name, data } = row;
            return data.map(x => `&${name}=${x}`).join("");
        });

        api_link += filter_str.join("");
    }

    if (search_str !== "") api_link += `&search=${search_str}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Narratives", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}