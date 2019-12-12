import React, { useState, useEffect } from "react";
import axios from "axios";
import SelectMultipleWithSuggest from "./SelectMultipleWithSuggest";
// import { sites } from "../../store";
import { prepareSiteAddress } from "../../UtilityFunctions";
import { host } from "../../config";

export function prepareSitesOption (arr, to_include_address) {
    return arr.map(site => {
        const { 
            site_code, site_id
        } = site;

        let address = site_code.toUpperCase();
        if (to_include_address) address = prepareSiteAddress(site, true, "start");
        return { value: site_id, label: address, data: site };
    });
}

function DynaslopeSiteSelectInputForm (props) {
    const { 
        value, changeHandler, isMulti,
        renderDropdownIndicator, includeAddressOnOptions,
        returnSiteDataCallback
    } = props;

    const [sites, setSites] = useState([]);

    useEffect(() => {
        const cancel_token = axios.CancelToken;
        const source = cancel_token.source();

        axios.get(`${host}/api/sites/get_sites_data`, { cancelToken: source.token })
        .then(response => {
            const { data } = response;
            setSites(data);
        })
        .catch(error => {
            console.log(error);
        });

        return () => {
            source.cancel();
        };
    }, []);

    const to_include_address = typeof includeAddressOnOptions === "undefined" ? true : includeAddressOnOptions;
    const options = prepareSitesOption(sites, to_include_address);

    const is_multi = (typeof isMulti === "undefined") ? false : isMulti;
    const placeholder = is_multi ? "Select site(s)" : "Select site";
    const to_render_dropdown = (typeof renderDropdownIndicator === "undefined") ? false : renderDropdownIndicator;

    let pass_value = value;
    if (value !== "") {
        const { label, value: site_id } = value;
        
        const callback = typeof returnSiteDataCallback === "undefined" ? false : returnSiteDataCallback;
        if (callback) {
            const site = sites.find(o => o.site_id === site_id);
            if (typeof site !== "undefined") returnSiteDataCallback(site);
        }

        if (typeof label === "undefined") {
            pass_value = options[site_id - 1];
        }
    }

    return (
        <SelectMultipleWithSuggest
            label={isMulti ? "Site(s)" : "Site"}
            options={options}
            value={pass_value}
            changeHandler={changeHandler}
            placeholder={placeholder}
            renderDropdownIndicator={to_render_dropdown}
            openMenuOnClick
            isMulti={is_multi}
        />
    );
}

export default DynaslopeSiteSelectInputForm;