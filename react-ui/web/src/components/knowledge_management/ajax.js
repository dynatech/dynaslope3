import { host } from "../../config";
import { makeGETAxiosRequest, makePOSTAxiosRequest } from "../../UtilityFunctions";

export function getFolderContents (folder_id, callback) {
    const api_link = `${host}/api/knowledge_management/get_folder_contents/${folder_id}`;
    makeGETAxiosRequest(api_link, callback);
}

export function getFolders (callback) {
    const api_link = `${host}/api/knowledge/get_folders`;
    makeGETAxiosRequest(api_link, callback);
}

export function saveFile (form, callback) {
    const api_link = `${host}/api/knowledge/save_file`;
    makePOSTAxiosRequest(api_link, form, callback);
}

export function create_folder (input, callback) {
    const api_link = `${host}/api/knowledge/create_folder`;
    makePOSTAxiosRequest(api_link, input, callback);
}
export function rename_folder (input, callback) {
    const api_link = `${host}/api/knowledge/rename_folder`;
    makePOSTAxiosRequest(api_link, input, callback);
}

export function update_file (input, callback) {
    const api_link = `${host}/api/knowledge/update_file`;
    makePOSTAxiosRequest(api_link, input, callback);
}

export function delete_folder (input, callback) {
    const api_link = `${host}/api/knowledge/delete_folder`;
    makePOSTAxiosRequest(api_link, input, callback);
}

export function delete_file (input, callback) {
    const api_link = `${host}/api/knowledge/delete_file`;
    makePOSTAxiosRequest(api_link, input, callback);
}