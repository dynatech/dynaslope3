import axios from "axios";
import { host } from "../../config";

export function getDataPresenceData (group, callback) {
    const api_link = `${host}/api/analysis/get_latest_data_presence/${group}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(`Data Presence: ${group}`, data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSurficialPlotData (input, callback, is_end_of_shift = false) {
    const { site_code, start, end } = input;
    let api_link = `${host}/api/surficial/get_surficial_plot_data/` +
        `${site_code}/${start}/${end}`;

    if (is_end_of_shift)
        api_link += "?is_end_of_shift=true";

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Surficial Plot Data", data);
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

export function getRainfallPlotData (input, callback) {
    const { site_code, ts_end } = input;
    const api_link = `${host}/api/rainfall/get_rainfall_plot_data/${site_code}/${ts_end}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Rainfall Plot Data", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function getSubsurfacePlotData (input, callback) {
    const { subsurface_column, ts_end } = input;
    const api_link = `${host}/api/subsurface/get_subsurface_plot_data/${subsurface_column}/${ts_end}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log("Subsurface Plot Data", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
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

export function getSiteSubsurfaceColumns (site_code, callback) {
    const api_link = `${host}/api/subsurface/get_site_subsurface_columns/${site_code}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(`Subsurface Columns of ${site_code.toUpperCase()}`, data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}

export function saveChartSVG (input, callback) {
    const api_link = `${host}/api/analysis/save_chart_svg`;
    
    axios.post(api_link, input)
    .then(response => {
        const { data } = response;
        console.log("Save SVG", data);
        callback(data);
    })
    .catch(error => {
        console.error(error);
    });
}