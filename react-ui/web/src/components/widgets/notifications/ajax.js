import { host } from "../../../config";
import { makePOSTAxiosRequest } from "../../../UtilityFunctions";

export function setAllUnseenNotifications (user_id) {
    const api_link = `${host}/api/notifications/set_all_seen_notifications`;
    makePOSTAxiosRequest(api_link, { user_id });
}

export function updateTSRead (notification_id, ts_read) {
    const api_link = `${host}/api/notifications/update_ts_read`;
    makePOSTAxiosRequest(api_link, { notification_id, ts_read });
}