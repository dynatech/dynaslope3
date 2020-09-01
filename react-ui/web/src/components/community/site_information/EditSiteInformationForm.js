import React, { useState, useEffect, useReducer } from "react";
import {
    Grid, Checkbox, TextField, Typography,
    FormControl, InputLabel, Select,
    MenuItem, Radio, RadioGroup,
    FormLabel, FormControlLabel
} from "@material-ui/core";
import { capitalizeFirstLetter, monthSorter } from "../../../UtilityFunctions";

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

function sanitizeData (data) {
    const clean_data = {};
    Object.keys(data).forEach(key => {
        clean_data[key] = data[key].value;
    });

    return clean_data;
}

function getHelperText (field, value) {
    if (value === "") return "Required field";

    if (field === "site_code") {
        if (value.length < 3) return "Site code must be three-lettered keyword";
    }

    return "";
}

function reducerFunction (state, action) {
    const { type, field, value } = action;
    const field_value = state[field];
    const new_helper_text = getHelperText(field, value);
    
    let new_value = value;
    if (["purok", "sitio", "households"].includes(field)) { new_value = value || null; }
    if (field === "season") new_value = parseInt(value, 10);

    switch (type) {
        case "UPDATE":
            return { ...state, [field]: {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            } };
        default:
            return { ...state };
    }
}

function initReducer (data) {
    const new_data = {};
    const not_required = ["sitio", "purok", "active", "site_id"];
    Object.keys(data).forEach(key => {
        new_data[key] = {
            value: data[key],
            helper_text: null,
            required: !not_required.includes(key)
        };
    });

    return new_data;
}

function EditSiteInformationForm (props) {
    const {
        siteInformation, setSiteInformationData,
        seasons, setIsDisabled
    } = props;

    const [site_data, dispatch] = useReducer(reducerFunction, siteInformation, initReducer);
    const [seasonPreview, setSeasonPreview] = useState([]);
    
    const seasonChangeHandler = event => {
        const selected_season = event.target.value;
        dispatch({ type: "UPDATE", field: "season", value: selected_season });
        const arrangedSeasons = arrangeSeasons(seasons, selected_season);
        setSeasonPreview(arrangedSeasons);
    };

    useEffect(() => {
        const is_disable_save = Object.keys(site_data).some(key => {
            const { required, helper_text } = site_data[key];
            return required && helper_text !== "" && helper_text !== null;
        });
    
        setIsDisabled(is_disable_save);
        setSiteInformationData(sanitizeData(site_data));
    }, [site_data]);
    
    useEffect(() => {
        if (site_data.season.value !== null) {
            const arrangedSeasons = arrangeSeasons(seasons, site_data.season.value);
            setSeasonPreview(arrangedSeasons);
        }
    }, [site_data.season.value]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    label="Site code"
                    fullWidth
                    required
                    inputProps={{
                        maxLength: 3
                    }}
                    value={site_data.site_code.value.toUpperCase()}
                    onChange={e => dispatch({ type: "UPDATE", field: "site_code", value: e.target.value })}
                    helperText={site_data.site_code.helper_text || ""}
                    error={Boolean(site_data.site_code.helper_text)}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Purok"
                    fullWidth
                    placeholder="Enter purok if available"
                    InputLabelProps={{ shrink: true }}
                    value={site_data.purok.value || ""}
                    onChange={e => dispatch({ type: "UPDATE", field: "purok", value: e.target.value })}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Sitio"
                    fullWidth
                    placeholder="Enter sitio if available"
                    InputLabelProps={{ shrink: true }}
                    value={site_data.sitio.value || ""}
                    onChange={e => dispatch({ type: "UPDATE", field: "sitio", value: e.target.value })}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Barangay"
                    fullWidth
                    required
                    value={site_data.barangay.value}
                    onChange={e => dispatch({ type: "UPDATE", field: "barangay", value: e.target.value })}
                    helperText={site_data.barangay.helper_text || ""}
                    error={Boolean(site_data.barangay.helper_text)}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Municipality"
                    fullWidth
                    required
                    value={site_data.municipality.value}
                    onChange={e => dispatch({ type: "UPDATE", field: "municipality", value: e.target.value })}
                    helperText={site_data.municipality.helper_text || ""}
                    error={Boolean(site_data.municipality.helper_text)}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Province"
                    fullWidth
                    required
                    value={site_data.province.value}
                    onChange={e => dispatch({ type: "UPDATE", field: "province", value: e.target.value })}
                    helperText={site_data.province.helper_text || ""}
                    error={Boolean(site_data.province.helper_text)}
                />
            </Grid>

            <Grid item xs={6}>
                <FormControl
                    required fullWidth
                    error={Boolean(site_data.region.helper_text)}
                >
                    <InputLabel id="region">Region</InputLabel>
                    <Select
                        labelId="region-select-label"
                        id="region-select-id"
                        required
                        value={site_data.region.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "region", value: e.target.value })}
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
                    value={site_data.psgc.value}
                    onChange={e => dispatch({ type: "UPDATE", field: "psgc", value: e.target.value })}
                    helperText={site_data.psgc.helper_text || ""}
                    error={Boolean(site_data.psgc.helper_text)}
                />
            </Grid>

            <Grid item xs={12}>
                <TextField
                    label="Elements at Risk"
                    fullWidth
                    required
                    value={site_data.households.value || ""}
                    onChange={e => dispatch({ type: "UPDATE", field: "households", value: e.target.value })}
                    helperText={site_data.households.helper_text || ""}
                    error={Boolean(site_data.households.helper_text)}
                />
            </Grid>

            <Grid item xs={6} container justify="center" alignItems="center">
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={site_data.active.value}
                                onChange={e => dispatch({ type: "UPDATE", field: "active", value: e.target.checked })}
                                value="checkedA"
                                color="primary"
                            />
                        }
                        label="Active site"
                    />
                </FormControl>
            </Grid>

            <Grid item xs={6}>
                <FormControl component="fieldset" required error={Boolean(site_data.season.helper_text)}>
                    <FormLabel component="legend">Season</FormLabel>
                    <RadioGroup
                        row
                        aria-label="season_group"
                        name="season"
                        value={site_data.season.value.toString()}
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
                    seasonPreview.map(row => {
                        const { key, list } = row;

                        return (
                            <Grid item xs={6} key={key}>
                                <Typography variant="subtitle1" color="textSecondary" align="center">
                                    { capitalizeFirstLetter(key) }
                                </Typography>
                                <Typography variant="subtitle1" color="textPrimary" align="center">
                                    {
                                        list.map(l => capitalizeFirstLetter(l)).join(", ")
                                    }
                                </Typography>
                            </Grid>
                        );
                    })
                }
            </Grid>
        </Grid>
    );
}

export default EditSiteInformationForm;
