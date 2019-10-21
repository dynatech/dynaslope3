import React from "react";
import SelectMultipleWithSuggest from "./SelectMultipleWithSuggest";
import { sites } from "../../store";

function prepareSitesOption (arr) {
    return arr.map(site => {
        const { 
            site_code, sitio, purok,
            barangay, municipality, province,
            site_id
        } = site;
        let address = sitio !== null ? `Sitio ${sitio}, ` : "";
        address += purok !== null ? `Purok ${purok}, ` : "";
        address += `Brgy. ${barangay}, ${municipality}, ${province}`;
        address = `${site_code.toUpperCase()} (${address})`;

        return { value: site_id, label: address, data: site };
    });
}

function DynaslopeSiteSelectInputForm (props) {
    const { value, changeHandler, isMulti, renderDropdownIndicator } = props;
    const options = prepareSitesOption(sites);

    const is_multi = (typeof isMulti === "undefined") ? false : isMulti;
    const placeholder = is_multi ? "Select site(s)" : "Select site";
    const to_render_dropdown = (typeof renderDropdownIndicator === "undefined") ? false : renderDropdownIndicator;
    
    return (
        <SelectMultipleWithSuggest
            label="Site"
            options={options}
            value={value}
            changeHandler={changeHandler}
            placeholder={placeholder}
            renderDropdownIndicator={to_render_dropdown}
            openMenuOnClick
            isMulti={is_multi}
        />
    );
}

export default DynaslopeSiteSelectInputForm;