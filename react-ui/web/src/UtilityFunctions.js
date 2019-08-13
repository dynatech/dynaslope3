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

export { prepareSiteAddress };
