import React, { useState, useEffect } from "react";
import {
    Grid, Divider, makeStyles,
    List, Card, CardHeader,
    ListItem, ListItemText,
    ListItemIcon, Checkbox,
    Button, TextField, Typography,
    FormControl, InputLabel, Select,
    MenuItem, Radio, RadioGroup,
    FormLabel, FormControlLabel
} from "@material-ui/core";
import { capitalizeFirstLetter, monthSorter } from "../../../UtilityFunctions";

const useStyles = makeStyles(theme => ({
    form_message_style: {
        fontStyle: "italic"
    }
}));

const region_list = [
    "I", "II", "III", "IV-A", "IV-B",
    "V", "VI", "VII", "VIII", "IX",
    "X", "XI", "XII", "XIII", "CAR",
    "NCR", "BARMM"
];

function arrangeSeasons (seasons, current_season) {
    const season_data = seasons[current_season - 1];
    const dry = [];
    const wet = [];
    
    Object.keys(season_data).forEach(key => {
        if (season_data[key] === "d" || season_data[key] === "w")
            if (season_data[key] === "d") dry.push(key);
            else wet.push(key);
    });

    monthSorter(dry);
    monthSorter(wet);

    const list = [
        { key: "dry", list: dry },
        { key: "wet", list: wet }
    ];

    return list;
}

function EditSiteInformationForm (props) {
    const { setSiteInformationData, siteInformation, seasons } = props;
    const { 
        active, barangay, households, municipality,
        province, psgc, purok, region, season, site_code,
        sitio, site_id
    } = siteInformation;
    const initial_purok = purok ? null : "";
    const initial_sitio = sitio ? null : "";
    const classes = useStyles();
    const [current_season_preview, setCurrentSeasonPreview] = useState([]);
    const [current_site_code, setCurrentSiteCode] = useState(site_code.toUpperCase());
    const [current_purok, setCurrentPurok] = useState(initial_purok);
    const [current_sitio, setCurrentSitio] = useState(initial_sitio);
    const [current_barangay, setCurrentBarangay] = useState(barangay);
    const [current_municipality, setCurrentMunicipality] = useState(municipality);
    const [current_province, setCurrentProvince] = useState(province);
    const [current_region, setCurrentRegion] = useState(region);
    const [current_psgc, setCurrentPsgc] = useState(psgc);
    const [current_is_active, setCurrentIsActive] = useState(active);
    const [current_households, setCurrentHouseholds] = useState(households);
    const [current_season, setCurrentSeason] = useState(season.toString());
   
    const isActiveHandler = event => setCurrentIsActive(event.target.checked);
    const siteCodeHandler = event => {
        const field_value = event.target.value;
        setCurrentSiteCode(field_value.toUpperCase());
    };
    
    const seasonChangeHandler = event => {
        const selected_season = event.target.value;
        setCurrentSeason(selected_season);
        const arrangedSeasons = arrangeSeasons(seasons, selected_season);
        setCurrentSeasonPreview(arrangedSeasons);
    };

    useEffect(() => {
        const new_data = { 
            current_site_code, current_purok, current_sitio,
            current_barangay, current_municipality, current_province,
            current_region, current_psgc, current_is_active,
            current_households, current_season, site_id
        };

        setSiteInformationData(new_data);
    }, [current_site_code, current_purok, current_sitio,
        current_barangay, current_municipality, current_province,
        current_region, current_psgc, current_is_active,
        current_households, current_season, site_id]);
    
    useEffect(() => {
        const arrangedSeasons = arrangeSeasons(seasons, current_season);
        setCurrentSeasonPreview(arrangedSeasons);
    }, [season]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={6}>
                <TextField
                    label="Site code"
                    fullWidth
                    required
                    value={current_site_code}
                    onChange={siteCodeHandler}
                    inputProps={{
                        maxLength: 3
                    }}
                    helperText={current_site_code === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Purok"
                    fullWidth
                    value={current_purok}
                    onChange={event => setCurrentPurok(event.target.value)}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Sitio"
                    fullWidth
                    value={current_sitio}
                    onChange={event => setCurrentSitio(event.target.value)}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Barangay"
                    fullWidth
                    required
                    value={current_barangay}
                    onChange={event => setCurrentBarangay(event.target.value)}
                    helperText={current_barangay === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Municipality"
                    fullWidth
                    required
                    value={current_municipality}
                    onChange={event => setCurrentMunicipality(event.target.value)}
                    helperText={current_municipality === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Province"
                    fullWidth
                    required
                    value={current_province}
                    onChange={event => setCurrentProvince(event.target.value)}
                    helperText={current_province === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={6}>
                <FormControl required fullWidth>
                    <InputLabel id="region">Region</InputLabel>
                    <Select
                        labelId="region-select-label"
                        id="region-select-id"
                        value={current_region}
                        onChange={event => setCurrentRegion(event.target.value)}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {
                            region_list.map((item, i) => (
                                <MenuItem value={item} key={i}>{item}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="PSGC"
                    fullWidth
                    type="number"
                    required
                    value={current_psgc}
                    onChange={event => setCurrentPsgc(event.target.value)}
                    helperText={current_psgc === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label="Elements at Risk"
                    fullWidth
                    required
                    value={current_households}
                    onChange={event => setCurrentHouseholds(event.target.value)}
                    helperText={current_households === "" ? "Required field." : " "}
                />
            </Grid>
            <Grid item xs={6}>
                <FormControl>
                    <FormLabel component="legend">Active</FormLabel>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={current_is_active}
                                onChange={isActiveHandler}
                                value="checkedA"
                                color="primary"
                            />
                        }
                        label="is Active?"
                    />
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">Season</FormLabel>
                    <RadioGroup
                        row
                        aria-label="season_group"
                        name="season"
                        value={current_season}
                        onChange={seasonChangeHandler}
                    >
                        {
                            seasons.map((row, index) => {
                                const { season_group_id } = row;
                                return (
                                    <FormControlLabel
                                        value={season_group_id.toString()}
                                        control={<Radio color="primary"/>}
                                        label={`Season  ${season_group_id}`}
                                        key={`season_${season_group_id}`} />
                                );
                            })
                        }
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid item container xs={12}>
                {
                    current_season_preview.map(row => {
                        const { key, list } = row;

                        return (
                            <Grid item xs={6} key={key}>
                                <Typography variant="subtitle1" color="textSecondary">
                                    { capitalizeFirstLetter(key) }
                                </Typography>
                                <Typography variant="subtitle1" color="textPrimary">
                                    {
                                        list.map(l => capitalizeFirstLetter(l)).join(", ")
                                    }
                                </Typography>
                            </Grid>
                        );
                    })
                }
                {/* <Grid item xs={6}>
                    <Typography
                        variant="subtitle2"
                        display="block"
                        className={classes.form_message_style}
                        gutterBottom
                        align="center">
                    qweqwewe
                    </Typography>

                </Grid>
                <Grid item xs={6}>
                    <Typography
                        variant="subtitle2"
                        display="block"
                        className={classes.form_message_style}
                        gutterBottom
                        align="center">
                    acsdasd
                    </Typography>

                </Grid> */}
            </Grid>
        </Grid>
    );
}

export default EditSiteInformationForm;