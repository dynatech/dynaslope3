import React, { useContext, Fragment } from "react";
import { Typography } from "@material-ui/core";
import axios from "axios";
import CheckboxesGroup from "./CheckboxGroup";
import { prepareSiteAddress } from "../../UtilityFunctions";
import { GeneralContext } from "../contexts/GeneralContext";

// export function prepareSitesOption (arr, to_include_address) {
export function prepareSitesOption (arr, values) {
    const {
        checked_sites,
        given_sites
    } = values;
    const has_given_sites = given_sites.length > 0;
    return arr.map(site => {

        const { 
            site_code, site_id
        } = site;

        const is_checked = checked_sites.includes(site_id);
        const is_disabled = has_given_sites && !given_sites.includes(site_id);

        const s_code = site_code.toUpperCase();
        // if (to_include_address) address = prepareSiteAddress(site, true, "start");
        return { state: is_checked, value: site_id, label: s_code, is_disabled };
    });
}

function DynaslopeSiteCheckboxGroupForm (props) {
    // values = {
    //     checked_sites: [1, 2, 3],
    //     given_sites: [1, 2, 3, 4, 5, 6]
    // }
    const { 
        label, values, handleCheckboxEvent
    } = props;
    const { sites } = useContext(GeneralContext);

    const options = prepareSitesOption(sites, values);

    return (
        <Fragment>
            <Typography variant="body1">{label}</Typography>
            <CheckboxesGroup
                label={label}
                changeHandler={handleCheckboxEvent}
                choices={options}
                checkboxStyle="primary"
            />
        </Fragment>
    );
}

export default DynaslopeSiteCheckboxGroupForm;