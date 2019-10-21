import React, { Fragment, useState, useEffect } from "react";
import {
    TextField, Grid, withStyles
} from "@material-ui/core";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import { array } from "prop-types";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { sites } from "../../../store";


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

const sites_option = prepareSitesOption(sites);

const styles = theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    },
    checkboxGridContainer: {
        marginTop: 12,
        marginBottom: 6
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        width: "90%",
    },
    backButton: {
        marginRight: 1
    },
    instructions: {
        marginTop: 1,
        marginBottom: 1,
    }
});


function NarrativeForm (props) {
    const {
        classes, narrativeData,
        setNarrativeData
    } = props;

    const {
        narrative_id, site_list, narrative, event_id,
        type_id, timestamp, user_id
    } = narrativeData;

    useEffect(() => {
        if (narrative_id !== "") {
            const site_id = site_list[0];
            const site = sites_option.filter((number) => number.value === site_id);

            setNarrativeData({
                ...narrativeData,
                site_list: site
            });            
        }
    }, []);

    const handleDateTime = key => value => {
        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    const update_site_value = value => setNarrativeData({
        ...narrativeData,
        site_list: value  
    });

    const handleEventChange = key => event => {
        const { value } = event.target;

        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    return (

        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >
                <Grid item xs={12} className={classes.inputGridContainer}>
                    <DynaslopeSiteSelectInputForm 
                        value={site_list}
                        changeHandler={update_site_value}
                        isMulti                    
                    />
                </Grid>
                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="Reporter"
                        div_id="user_id"
                        changeHandler={handleEventChange("user_id")}
                        value={user_id}
                    />
                </Grid>
                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <KeyboardDateTimePicker
                        required
                        autoOk
                        label="Timestamp"
                        value={timestamp}
                        onChange={handleDateTime("timestamp")}
                        ampm={false}
                        placeholder="2019-01-01 00:00"
                        format="YYYY-MM-DD HH:mm"
                        mask="____-__-__ __:__"
                        clearable
                        disableFuture
                    />
                </Grid>
                <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                    <TextField
                        required
                        id="standard-multiline-static"
                        label="Narrative"
                        value={narrative}
                        onChange={handleEventChange("narrative")}
                        placeholder="Enter narrative"
                        multiline
                        rows="4"
                        rowsMax={4}
                        fullWidth
                        className={classes.textField}
                        variant="filled"
                    />
                </Grid>
            </Grid>
        </MuiPickersUtilsProvider>           
    );
}


export default withStyles(styles)(NarrativeForm);
