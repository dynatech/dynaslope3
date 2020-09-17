import React, { useContext } from "react";
import SelectMultipleWithSuggest from "./SelectMultipleWithSuggest";
import { prepareSiteAddress } from "../../UtilityFunctions";
import { GeneralContext } from "../contexts/GeneralContext";

export function prepareSitesOption (arr, to_include_address, isFromSiteLogs) {
    return arr.map(site => {
        const { 
            site_code, site_id
        } = site;

        let address = site_code.toUpperCase();
        
        if (to_include_address) address = prepareSiteAddress(site, true, "start");

        // check sites if on-event
        let color = "black";
        let event_id = null;
        if (typeof isFromSiteLogs !== "undefined" && isFromSiteLogs !== null) {
            const { latest, extended, overdue } = isFromSiteLogs;
            const merged_latest = [...latest, ...overdue];
            const sc = site_code.toLowerCase();

            // const is_ev = merged_latest.find(x => x.event.site.site_code === sc);
            // const is_ex = extended.find(x => x.event.site.site_code === sc);
            const ev_index = merged_latest.findIndex(x => x.event.site.site_code === sc);
            const ex_index = extended.findIndex(x => x.event.site.site_code === sc);
            
            if (ev_index > -1) {
                color = "red"; 
                event_id = merged_latest[ev_index].event.event_id; 
            }
            if (ex_index > -1) {
                color = "green";
                event_id = extended[ex_index].event.event_id;
            }
        }

        return { value: site_id, label: address, data: site, color, event_id };
    });
}

function DynaslopeSiteSelectInputForm (props) {
    const { 
        value, changeHandler, isMulti,
        renderDropdownIndicator, includeAddressOnOptions,
        returnSiteDataCallback, isFromSiteLogs,
        disabled, customPlaceholder, isClearable
    } = props;
    const { sites } = useContext(GeneralContext);

    const to_include_address = typeof includeAddressOnOptions === "undefined" ? true : includeAddressOnOptions;
    const options = prepareSitesOption(sites, to_include_address, isFromSiteLogs);

    const is_multi = (typeof isMulti === "undefined") ? false : isMulti;
    let placeholder = is_multi ? "Select site(s)" : "Select site";
    placeholder = customPlaceholder || placeholder;
    const to_render_dropdown = (typeof renderDropdownIndicator === "undefined") ? false : renderDropdownIndicator;
    const is_clearable = (typeof isClearable === "undefined") ? false : isClearable;

    let pass_value = value;
    if (value !== "" && value !== null) {
        const { label, value: site_id } = value;
        const callback = typeof returnSiteDataCallback === "undefined" ? false : returnSiteDataCallback;
        if (callback) {
            const site = sites.find(o => o.site_id === site_id);
            if (typeof site !== "undefined") returnSiteDataCallback(site);
        }

        if (typeof label === "undefined" && !is_multi) {
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
            isDisabled={Boolean(disabled)}
            isClearable={is_clearable}
        />
    );
}

export default DynaslopeSiteSelectInputForm;