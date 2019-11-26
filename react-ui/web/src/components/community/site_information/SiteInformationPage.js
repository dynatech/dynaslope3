import React, { Fragment, useState, useEffect } from "react";

import {
    withStyles, Grid, Typography,
    Divider
} from "@material-ui/core";

import GeneralStyles from "../../../GeneralStyles";
import SiteInformationSheet from "./SiteInformationSheet";
import SiteCurrentStatus from "./SiteCurrentStatus";
import SiteStakeholdersList from "./SiteStakeholdersList";
import SiteEventsTable from "./SiteEventsTable";
import BackToMainButton from "./BackToMainButton";
// import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { getSites } from "../../monitoring/ajax";


function SiteInformationPage (props) {
    const { 
        classes, width, match: { params: { site_code } },
        siteInformation
    } = props;

    const [site_as_title, setSiteAsTitle] = useState("");
    const [local_site_information, setLocalSiteInformation] = useState({});
    const [siteIdToPass, setSiteIdToPass] = useState("");

    useEffect(() => {
        setLocalSiteInformation(siteInformation);
        setSiteIdToPass(siteInformation.site_id);
        // if (typeof siteInformation.site_code !== "undefined") {
        //     console.log(siteInformation);
        //     setSiteIdToPass(siteInformation.site_id);
        //     setSiteAsTitle(siteInformation.site_code.toUpperCase());
        // }

        const no_site_info_provided = typeof local_site_information.site_code === "undefined" || local_site_information.site_code === "";
        if (no_site_info_provided) {
            getSites(site_code, ret => {
                setLocalSiteInformation(ret);
                setSiteIdToPass(ret.site_id);
                setSiteAsTitle(site_code.toUpperCase());
            });
        }
    }, []);

    return (
        <Fragment>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <BackToMainButton {...props} width={width} />
                {/* <InsertMomsButton clickHandler={set_moms_modal_fn(true)} /> */}
            </div>
            <Grid container spacing={2}>
                <Fragment>
                    <Grid item xs={12} sm={12} style={{ textAlign: "center", paddingTop: 20 }}>
                        <Fragment>
                            <Typography variant="h5" color="textSecondary">
                        Site Code
                            </Typography>
                            <Typography variant="h2" color="textPrimary">
                                {site_as_title}
                            </Typography>
                        </Fragment>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider className={classes.divider}/>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <SiteInformationSheet
                            {...props}
                            siteInformation={local_site_information}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        {
                            typeof siteIdToPass !== "undefined" && siteIdToPass !== "" && (
                                <SiteCurrentStatus
                                    {...props}
                                    siteId={siteIdToPass}
                                />
                            )
                        }
                    </Grid>

                    <Grid item xs={12}>
                        <SiteStakeholdersList
                            siteCode={site_code}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        {
                            typeof siteIdToPass !== "undefined" && (
                                <SiteEventsTable
                                    {...props}
                                    siteId={siteIdToPass}
                                />
                            )
                        }
                        {/* Test */}
                    </Grid>
                </Fragment>
            </Grid>

        </Fragment>
    );
}

export default withStyles(GeneralStyles)(SiteInformationPage);