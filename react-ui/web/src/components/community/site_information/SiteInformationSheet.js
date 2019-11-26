import React from "react";
import {
    Grid, Paper, Typography, Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import GeneralStyles from "../../../GeneralStyles";

const useStyle = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        customPaper: {
            // width: "100%",
            padding: 8,
            // maxWidth: "100%",
            marginTop: 10, textAlign: "center" 
        }
    };
});

function SiteInformationSheet (props) {
    const classes = useStyle();
    const {
        siteInformation
    } = props;
    const { 
        site_id, site_code, purok,
        sitio, barangay, municipality,
        province, region, active,
        psgc, households, season
    } = siteInformation;

    const is_active_site = active ? "Active" : "Inactive";

    return (
        <Paper className={classes.customPaper}>
            <Typography variant="h6" color="primary">Site Details</Typography>
            <Divider className={classes.Divider} />

            <Grid container spacing={2} style={{ paddingTop: 5 }}>
                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                            Site ID
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {site_id}
                    </Typography>
                </Grid>

                {
                    purok !== null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="textSecondary">
                                Purok
                            </Typography>
                            <Typography variant="body1" color="textPrimary">
                                {purok}
                            </Typography>
                        </Grid>    
                    )
                }

                {
                    sitio !== null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="textSecondary">
                                Sitio
                            </Typography>
                            <Typography variant="body1" color="textPrimary">
                                {sitio}
                            </Typography>
                        </Grid>    
                    )
                }

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                            Barangay
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {barangay}
                    </Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Municipality
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {municipality}
                    </Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Province
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {province}
                    </Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Region
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {region}
                    </Typography>
                </Grid>

                {
                    active !== null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="textSecondary">
                                Active Status
                            </Typography>
                            <Typography variant="body1" color="textPrimary">
                                {is_active_site}
                            </Typography>
                        </Grid>
                    )
                }

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        PSGC
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {psgc}
                    </Typography>
                </Grid>

                <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Season
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {season}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={12}>
                    <Typography variant="body2" color="textSecondary">
                        Households
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {households}
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );

}

export default (SiteInformationSheet);