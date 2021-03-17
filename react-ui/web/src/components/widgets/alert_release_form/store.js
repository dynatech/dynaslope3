import React, { createContext, useReducer } from "react";
import moment from "moment";
import cloneDeep from "lodash/cloneDeep";

import { getCurrentUser } from "../../sessions/auth";

export const Store = createContext();

const initial_state = {
    data_ts: null,
    release_time: moment(),
    site: "",
    iomp_mt: "",
    iomp_ct: "",
    subsurface: {
        value: "",
        triggers: {
            "2": { checked: false, ts: null, tech_info: "" },
            "3": { checked: false, ts: null, tech_info: "" },
        }
    },
    surficial: {
        value: "",
        triggers: {
            "2": { checked: false, ts: null, tech_info: "" },
            "3": { checked: false, ts: null, tech_info: "" },
        }
    },
    moms: {
        value: "-1",
        triggers: {
            "2": { checked: false, ts: null, tech_info: "" },
            "3": { checked: false, ts: null, tech_info: "" },
        }
    },
    rainfall: {
        value: "",
        trigger: { ts: null, tech_info: "" }
    },
    "on demand": {
        value: "-1",
        trigger: { ts: null, tech_info: "" }
    },
    earthquake: {
        value: "",
        trigger: {
            ts: null, tech_info: "", magnitude: "",
            latitude: "", longitude: ""
        }
    },
    comments: "",
    validation: {},
    previous_release: null,
    post_computation: null,
    non_triggering_moms: [],
    manually_lower_alert: false,
    preview: null
};

function reducer (state, action) {
    const { type, payload } = action;
    const { validation: temp_validation } = state;

    const temp_state = cloneDeep(state);

    switch (type) {
        case "UPDATE_DATA_TS": {
            let helper_text = "";
            if (payload === null) helper_text = "Required field";
            else if (!payload.isValid()) helper_text = "Invalid date/time format";
            const validation = {
                ...temp_validation,
                data_ts: helper_text
            };
            return {
                ...state,
                data_ts: payload,
                validation
            };
        }

        case "UPDATE_RELEASE_TIME": {
            let helper_text = "";
            if (payload === null) helper_text = "Required field";
            else if (!payload.isValid()) helper_text = "Invalid time format";
            const validation = {
                ...temp_validation,
                release_time: helper_text
            };
            return {
                ...state,
                release_time: payload,
                validation
            };
        }
        
        case "UPDATE_SITE": {
            const validation = {
                ...temp_validation,
                site: payload ? "" : "Required field"
            };
            return {
                ...state,
                site: payload,
                validation
            };
        }
        
        case "UPDATE_CT_PERSONNEL": {
            const validation = {
                ...temp_validation,
                iomp_ct: payload ? "" : "Required field"
            };
            return {
                ...state,
                iomp_ct: payload,
                validation
            };
        }

        case "UPDATE_SUBSURFACE_PRESENCE": {
            const { subsurface } = state;
            return {
                ...state,
                subsurface: {
                    ...subsurface,
                    value: payload
                }
            };
        }

        case "UPDATE_SUBSURFACE_TRIGGER": {
            const { key, value } = payload;

            const { subsurface: { triggers } } = temp_state;
            const trigger = triggers[key]; 

            temp_state.subsurface.triggers[key] = {
                ...trigger, checked: value
            };

            return temp_state;
        }

        case "UPDATE_SUBSURFACE_TRIGGER_DETAILS": {
            const { key, value, attr } = payload;

            const { subsurface: { triggers } } = temp_state;
            const trigger = triggers[key];
            temp_state.subsurface.triggers[key] = {
                ...trigger, [attr]: value
            };
            return temp_state;
        }

        case "UPDATE_SURFICIAL_PRESENCE": {
            const { surficial } = state;
            return {
                ...state,
                surficial: {
                    ...surficial,
                    value: payload
                }
            };
        }

        case "UPDATE_SURFICIAL_TRIGGER": {
            const { key, value } = payload;

            const { surficial: { triggers } } = temp_state;
            const trigger = triggers[key];
            temp_state.surficial.triggers[key] = {
                ...trigger, checked: value
            };
            return temp_state;
        }

        case "UPDATE_SURFICIAL_TRIGGER_DETAILS": {
            const { key, value, attr } = payload;

            const { surficial: { triggers } } = temp_state;
            const trigger = triggers[key];
            temp_state.surficial.triggers[key] = {
                ...trigger, [attr]: value
            };
            return temp_state;
        }

        case "UPDATE_RAINFALL_PRESENCE": {
            const { rainfall } = state;
            return {
                ...state,
                rainfall: {
                    ...rainfall,
                    value: payload
                }
            };
        }

        case "UPDATE_RAINFALL_TRIGGER_DETAILS": {
            const { value, attr } = payload;

            const { rainfall: { trigger } } = temp_state;
            temp_state.rainfall.trigger = {
                ...trigger, [attr]: value
            };
            return temp_state;
        }

        case "UPDATE_EARTHQUAKE_PRESENCE": {
            const { earthquake } = state;
            return {
                ...state,
                earthquake: {
                    ...earthquake,
                    value: payload
                }
            };
        }

        case "UPDATE_EARTHQUAKE_TRIGGER_DETAILS": {
            const { value, attr } = payload;

            const { earthquake: { trigger } } = temp_state;
            temp_state.earthquake.trigger = {
                ...trigger, [attr]: value
            };
            return temp_state;
        }

        case "UPDATE_COMMENTS":
            return { ...state, comments: payload };

        case "SAVE_LATEST_SITE_EVENT_DETAIL":
            return { ...state, previous_release: payload };

        case "SAVE_POST_COMPUTATION_DETAILS":
            return { ...state, 
                post_computation: { ...payload },
                preview: { ...payload } 
            };

        case "USE_CANDIDATE_ALERT": {
            const temp = insertCandidateAlertDetails(payload, state);
            return temp;
        }

        case "UPDATE_MANUALLY_LOWER_ALERT": {
            const { subsurface, surficial, moms } = state;
            const has_no_ground_data = [subsurface, surficial, moms].every(x => x.value === "-1");
            const trigger_list_str = has_no_ground_data ? "ND" : "A0";

            let temp = {
                internal_alert: trigger_list_str,
                trigger_list_str,
                note: "You are manually lowering an alert. We are encouraging you to REVIEW ALL THE INPUTS in the previous section. " +
                "Also, beware that if it is not yet end-of-validity, lowering an alert will cause the whole site monitoring event to be \"invalid\".",
                trigger_list: [],
                to_extend_validity: false
            };
            
            if (!payload) {
                temp = { ...state.post_computation };
            }

            return { ...state, 
                manually_lower_alert: payload,
                preview: { ...state.preview, ...temp }
            };
        }

        case "RESET":
            return { ...initial_state };
  
        default:
            return state;
    }
}

function isNextButtonDisabled (step, state) {
    switch (step) {
        case 0: {
            const required = ["site", "data_ts", "release_time", "iomp_ct"];
            return required.some(key => {
                return Boolean(state.validation[key]) || !state[key];
            });
        }
        case 1: {
            const required = ["subsurface", "surficial", "rainfall", "earthquake"];
            return required.some(key => {
                if (state[key].value === "1") {
                    const { trigger, triggers } = state[key];
                    const temp = [];
                    if (typeof trigger !== "undefined") {
                        temp.push({ ...trigger, checked: true });
                    } else {
                        temp.push(...Object.values(triggers));
                        if (temp.every(x => !x.checked)) return true;
                    }

                    const truth = temp.map(row => {
                        if (row.checked) {
                            return !Object.values(row).every(x => Boolean(x));
                        }
                        return false;
                    });

                    return truth.some(x => x);
                }

                return Boolean(state.validation[key]) || !state[key].value;
            });
        }
        case 2: {
            return Boolean(!state.iomp_ct);
        }

        default: return true;
    }
}

function insertCandidateAlertDetails (candidate_alert, current_state) {
    const state_copy = cloneDeep(initial_state);

    const source_set = new Set();
    candidate_alert.trigger_list_arr.forEach((row, i) => {
        const { trigger_type: source } = row;
        source_set.add(source);
        state_copy[source].value = "1";

        if (["subsurface", "surficial", "moms"].includes(source)) {
            state_copy[source].triggers[row.alert_level] = {
                checked: true,
                tech_info: row.tech_info,
                ts: row.ts_updated
            };

            if (source === "moms") {
                state_copy.moms.triggers[row.alert_level].moms_list = row.moms_list;
            }
        } else {
            state_copy[source].trigger = {
                tech_info: row.tech_info,
                ts: row.ts_updated
            };

            if (source === "on demand") {
                state_copy[source].trigger.od_details = row.od_details;
            }
        }

        // eslint-disable-next-line no-param-reassign
        candidate_alert.trigger_list_arr[i] = { 
            ...row, source, alert_symbol: row.alert[0],
            ts: row.ts_updated
        };
    });

    candidate_alert.current_triggers_status.forEach(row => {
        if (!source_set.has(row.trigger_source)) {
            state_copy[row.trigger_source].value = `${row.alert_level}`;
        }

        if (!source_set.has("earthquake")) state_copy.earthquake.value = "0";
    });

    const temp = {
        public_alert_level: candidate_alert.public_alert_level,
        internal_alert: candidate_alert.internal_alert_level,
        note: null,
        trigger_list: candidate_alert.trigger_list_arr,
        trigger_list_str: candidate_alert.release_details.trigger_list_str,
        to_extend_validity: candidate_alert.to_extend_validity
    };

    return {
        ...state_copy,
        data_ts: candidate_alert.release_details.data_ts,
        release_time: moment(),
        site: {
            value: candidate_alert.site_id,
            data: { site_code: candidate_alert.site_code }
        },
        previous_release: { ...candidate_alert.previous_release },
        post_computation: temp,
        preview: temp,
        non_triggering_moms: candidate_alert.non_triggering_moms,
        iomp_ct: current_state.iomp_ct
    };
}

function preparePayload (state) {
    let temp_comments = state.comments;
    if (state.manually_lower_alert) {
        temp_comments = `<MANUALLY LOWERED; this is added by system> ${ temp_comments}`;
    }

    return {
        site_id: state.site.value,
        site_code: state.site.data.site_code,
        public_alert_level: state.preview.public_alert_level,
        release_details: {
            data_ts: moment(state.data_ts).format("YYYY-MM-DD HH:mm:00"),
            trigger_list_str: state.preview.trigger_list_str,
            release_time: moment(state.release_time).format("HH:mm:00"),
            comments: temp_comments
        },
        publisher_details: {
            publisher_mt_id: state.iomp_mt,
            publisher_ct_id: state.iomp_ct
        },
        to_extend_validity: state.preview.to_extend_validity,
        trigger_list_arr: state.preview.trigger_list,
        non_triggering_moms: state.non_triggering_moms
    };
}

export function StoreProvider ({ children }) {
    const { user_id } = getCurrentUser();
    initial_state.iomp_mt = user_id;

    const [state, dispatch] = useReducer(reducer, initial_state);
    const validateIfNextIsDisabled = step => {
        return isNextButtonDisabled(step, state);
    };

    const prepareAlertReleasePayload = pre_state => {
        return preparePayload(pre_state);
    };

    const value = { state, dispatch, validateIfNextIsDisabled, prepareAlertReleasePayload };

    return <Store.Provider value={value}>{children}</Store.Provider>;
}