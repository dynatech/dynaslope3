import axios from "axios";
import { sample_subsurface_data } from "./integrated_site/sample_subsurface_data_not_final";

const host = "http://192.168.150.167:5000";

export function getSurficialPlotData (site_code, timestamps, callback) {
    const api_link = `${host}/api/surficial/get_surficial_plot_data/` +
        `${site_code}/${timestamps.start}/${timestamps.end}`;

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

export function deleteSurficialData (input, callback) {
    const api_link = `${host}/api/surficial/delete_surficial_data`;

    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Delete Surficial Data Response", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function updateSurficialData (input, callback) {
    const api_link = `${host}/api/surficial/update_surficial_data`;

    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Update Surficial Data Response", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSurficialMarkerTrendingData (input, callback) {
    const { site_code, marker_name, ts_end } = input;
    const api_link = `${host}/api/surficial/get_surficial_marker_trending_data/` +
        `${site_code}/${marker_name}/${ts_end}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Surficial Marker Trending Data", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getRainfallPlotData (filter, timestamps, callback) {
    // Do something
}

export function getSubsurfacePlotData (input, callback) {
    const subsurface_data = [...sample_subsurface_data];
    callback(subsurface_data);
}

export function getEarthquakeEvents (callback) {
    const api_link = `${host}/api/analysis/get_earthquake_events`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Earthquake Events", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getEarthquakeAlerts (request, callback) {
    const { limit, offset } = request;
    const api_link = `${host}/api/analysis/get_earthquake_alerts`
    + `?limit=${limit}&offset=${offset}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Earthquake Alerts", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getMOMsAlertSummary (callback) {
    const api_link = `${host}/api/manifestations_of_movement/get_latest_alerts`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("MOMs Alerts", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getMOMsInstances (site_code, callback) {
    const api_link = `${host}/api/manifestations_of_movement/get_moms_instances/${site_code}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(`MOMs Instances of ${site_code.toUpperCase()}`, data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}