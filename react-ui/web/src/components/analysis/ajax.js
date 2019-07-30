import axios from "axios";
import { sample_subsurface_data } from "./integrated_site/sample_subsurface_data_not_final";

export default function getSurficialPlotData (site_code, timestamps, callback) {
    const api_link = `http://127.0.0.1:5000/api/surficial/get_surficial_plot_data/` +
        `${site_code}/${timestamps.start}/${timestamps.end}`;

    axios.get(api_link)
    .then(response => {
        const { data } = response;
        console.log(data);
        callback(data);
    })
    .catch(error => {
        console.log(error);
    });
}

export function getRainfallPlotData (filter, timestamps, callback) {
    // Do something
}

export function getSubsurfacePlotData (input, callback) {
    const subsurface_data = [...sample_subsurface_data];
    callback(subsurface_data);
}