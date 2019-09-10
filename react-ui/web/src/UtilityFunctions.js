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

export { prepareSiteAddress, capitalizeFirstLetter };
