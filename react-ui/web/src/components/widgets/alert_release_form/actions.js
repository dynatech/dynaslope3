
const updateDataTS = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_DATA_TS", payload });
};

const updateReleaseTime = ({ dispatch, payload }) => {
    dispatch({ type: "UPDATE_RELEASE_TIME", payload });
};

const updateSite = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SITE", payload });
};

const updateCTPersonnel = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_CT_PERSONNEL", payload });
};

const updateSubsurfacePresence = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SUBSURFACE_PRESENCE", payload });
};

const updateSubsurfaceTrigger = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SUBSURFACE_TRIGGER", payload });
};

const updateSubsurfaceTriggerDetails = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SUBSURFACE_TRIGGER_DETAILS", payload });
};

const updateSurficialPresence = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SURFICIAL_PRESENCE", payload });
};

const updateSurficialTrigger = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SURFICIAL_TRIGGER", payload });
};

const updateSurficialTriggerDetails = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_SURFICIAL_TRIGGER_DETAILS", payload });
};

const updateRainfallPresence = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_RAINFALL_PRESENCE", payload });
};

const updateRainfallTriggerDetails = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_RAINFALL_TRIGGER_DETAILS", payload });
};

const updateEarthquakePresence = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_EARTHQUAKE_PRESENCE", payload });
};

const updateEarthquakeTriggerDetails = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_EARTHQUAKE_TRIGGER_DETAILS", payload });
};

const updateComments = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_COMMENTS", payload });
};


const saveLatestSiteEventDetail = ({ dispatch, payload }) => {
    return dispatch({ type: "SAVE_LATEST_SITE_EVENT_DETAIL", payload });
};

const savePostComputationDetails = ({ dispatch, payload }) => {
    return dispatch({ type: "SAVE_POST_COMPUTATION_DETAILS", payload });
};

const useCandidateAlert = ({ dispatch, payload }) => {
    return dispatch({ type: "USE_CANDIDATE_ALERT", payload });
};

const updateManuallyLowerAlert = ({ dispatch, payload }) => {
    return dispatch({ type: "UPDATE_MANUALLY_LOWER_ALERT", payload });
};

const reset = ({ dispatch }) => {
    return dispatch({ type: "RESET" });
};

export default {
    updateDataTS,
    updateReleaseTime,
    updateSite,
    updateCTPersonnel,
    updateSubsurfacePresence,
    updateSubsurfaceTrigger,
    updateSubsurfaceTriggerDetails,
    updateSurficialPresence,
    updateSurficialTrigger,
    updateSurficialTriggerDetails,
    updateRainfallPresence,
    updateRainfallTriggerDetails,
    updateEarthquakePresence,
    updateEarthquakeTriggerDetails,
    updateComments,
    saveLatestSiteEventDetail,
    savePostComputationDetails,
    useCandidateAlert,
    updateManuallyLowerAlert,
    reset
};