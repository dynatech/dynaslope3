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

export {
    prepareSiteAddress, capitalizeFirstLetter,
    getUserOrganizations, simNumFormatter
};
