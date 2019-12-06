import axios from "axios";
import { useEffect, useRef } from "react";

function prepareSiteAddress (site_details, include_site_code = true, position = "end") {
    const { purok, sitio, barangay, municipality, province, site_code } = site_details;
    let address = "";

    if (sitio !== null) address = `Sitio ${sitio}, `;
    if (purok !== null) address += `Purok ${purok}, `;

    address += `Brgy. ${barangay}, ${municipality}, ${province}`;
    if (include_site_code) {
        const upper_sc = site_code.toUpperCase();
        if (position === "end")
            address += ` (${upper_sc})`;
        else
            address = `${upper_sc} (${address})`;
    }

    return address;
}

function capitalizeFirstLetter (str, every_word = false) {
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    if (every_word) {
        const arr = str.split(" ");
        const cap_arr = arr.map(s => capitalize(s));

        return cap_arr.join(" ");
    }

    return capitalize(str);
}

function getUserOrganizations (user, return_grouped = false) {
    const { organizations } = user;
    let org = null;
    const sites = organizations.map(row => {
        const { site, org_name } = row;
        org = org_name.toUpperCase();

        if (return_grouped) return site;

        return site.site_code.toUpperCase();
    });

    if (return_grouped) {
        return {
            sites,
            org
        };
    } 
    
    if (org) {
        sites.unshift(org);
    }

    return sites;
}

function simNumFormatter (sim_num) {
    return sim_num[0] === "0" ? sim_num : `+${sim_num}`;
}

function computeForStartTs (ts, duration = 7, unit = "days") {
    const ts_format = "YYYY-MM-DD HH:mm:ss";
    const ts_start = ts.subtract(duration, unit).format(ts_format);
    return ts_start;
}

function makePOSTAxiosRequest (api_link, callback = null, payload) {
    axios.post(api_link, payload)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}

function makeGETAxiosRequest (api_link, callback = null) {
    axios.get(api_link)
    .then((response) => {
        const { data } = response; 
        if (callback !== null) {
            callback(data);
        } 
    })
    .catch((error) => {
        console.log(error);
    });
}

function useInterval (callback, delay, clear_interval = false) {
    const savedCallback = useRef();
  
    useEffect(() => {
        savedCallback.current = callback;
    });
  
    useEffect(() => {
        function tick () {
            savedCallback.current();
        }
  
        const id = setInterval(tick, delay);

        if (clear_interval) clearInterval(id);
        return () => clearInterval(id);
    }, [delay, clear_interval]);
}
export {
    prepareSiteAddress, capitalizeFirstLetter,
    getUserOrganizations, simNumFormatter,
    computeForStartTs, makePOSTAxiosRequest,
    makeGETAxiosRequest, useInterval
};