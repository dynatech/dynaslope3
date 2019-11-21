import React, { Fragment, useState, useEffect } from "react";
import { Route, Link } from "react-router-dom";

import {
    withStyles, Grid, Paper, Typography
} from "@material-ui/core";
import moment from "moment";

import { getSites } from "../../monitoring/ajax";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";


function SiteInformationSheet (props) {
    const {
        classes, siteInformation
    } = props;
    const { 
        site_id, site_code, purok,
        sitio, barangay, municipality,
        province, region, active,
        psgc, households, season
    } = siteInformation;


    const site_as_title = typeof site_code !== "undefined" ? site_code.toUpperCase() : "";

    return (

        // <Paper fullWidth style={{ marginTop: 16 }}>        
        <Grid item xs={12} container spacing={2} style={{ paddingTop: 20 }}>
            
            <Grid item xs={12} sm={12} style={{ textAlign: "center" }}>
                <Typography variant="h5" color="textSecondary">
                    Site Code
                </Typography>
                <Typography variant="h2" color="textPrimary">
                    {site_as_title}
                </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
                <Typography variant="body1" color="textSecondary">
                        Site ID
                </Typography>
                <Typography variant="body1" color="textPrimary">
                    {site_id}
                </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
                <Typography variant="body1" color="textSecondary">
                        Barangay
                </Typography>
                <Typography variant="body1" color="textPrimary">
                    {barangay}
                </Typography>
            </Grid>
        </Grid>
        // </Paper>
    );
}


function SiteInformationPage (props) {
    const { 
        classes, width
    } = props;

    const [site, setSite] = useState("");
    const [siteInformation, setSiteInformation] = useState((<Typography>Please choose a site.</Typography>));

    console.log("siteInformation", siteInformation);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Events" />
            </div>
            <div className={classes.pageContentMargin}>
                <Grid container spacing={2}>
                    <Grid item xs={12} className={classes.inputGridContainer}>
                        <DynaslopeSiteSelectInputForm
                            value={site}
                            changeHandler={value => setSite(value)}
                            // renderDropdownIndicator={false}
                            returnSiteDataCallback={ret => setSiteInformation(ret)}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} container spacing={1}>
                    <SiteInformationSheet
                        {...props}
                        siteInformation={siteInformation}
                    />
                </Grid>
                <Grid item xs={12} container spacing={1}>
                    <Paper style={{ marginTop: 16 }}>
                        Site Contacts
                    </Paper>
                </Grid>
            </div>


        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SiteInformationPage);