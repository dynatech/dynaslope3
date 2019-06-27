import React from "react";
import SelectMultipleWithSuggest from "./SelectMultipleWithSuggest";
import { sites } from "../../store";

function prepareSitesOption (arr) {
    return arr.map(site => {
        const { 
            site_code, sitio, purok,
            barangay, municipality, province
        } = site;
        let address = sitio !== null ? `Sitio ${sitio}, ` : "";
        address += purok !== null ? `Purok ${purok}, ` : "";
        address += `Brgy. ${barangay}, ${municipality}, ${province}`;
        address = `${site_code.toUpperCase()} (${address})`;

        return { value: site_code, label: address, data: site };
    });
}

function DynaslopeSiteSelectInputForm (props) {
    const { value, changeHandler } = props;
    const options = prepareSitesOption(sites);
    
    return (
        <SelectMultipleWithSuggest
            label="Site"
            options={options}
            value={value}
            changeHandler={changeHandler}
            placeholder="Select site"
            renderDropdownIndicator
            openMenuOnClick
        />
    );
}

export default DynaslopeSiteSelectInputForm;