import { host } from "../../config";
import { makePOSTAxiosRequest } from "../../UtilityFunctions";

export function handleUpdateInsertTags (payload, callback) {
    const api_link = `${host}/api/general_data_tag/handle_update_insert_tags`;

    makePOSTAxiosRequest(api_link, payload, callback);
}

export function handleDeleteTags (payload, callback) {
    const api_link = `${host}/api/general_data_tag/handle_delete_tags`;

    makePOSTAxiosRequest(api_link, payload, callback);
}
