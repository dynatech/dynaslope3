import React, { 
    Fragment, useState, 
    useEffect, useContext
} from "react";

import {
    Grid, Typography, withWidth
} from "@material-ui/core";
import ContentLoader from "react-content-loader";

import { Route, Switch, Link } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";

import SiteInformationPage from "./SiteInformationPage";
import PhilippineMap from "./PhilippineMap";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import { GeneralContext } from "../../contexts/GeneralContext";
import { prepareSiteAddress } from "../../../UtilityFunctions";

const useStyles = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    const { innerHeight } = window;
    const height = 118 + ((innerHeight - 118) * 0.06);
    
    return {
        ...general_styles,
        sticky: {
            position: "sticky",
            top: height, // 190,
            [theme.breakpoints.down("sm")]: {
                top: 48
            },
            backgroundColor: "white",
            zIndex: 1
        }
    };
});

const MapLoader = () => (
    <ContentLoader 
        height={300}
        width={684}
        speed={1}
        foregroundColor="#f3f3f3"
        backgroundColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="10" y="1" rx="0" ry="0" width="561" height="700" />
    </ContentLoader>
);

function SitesPerRegion (props) {
    const { sitesPerRegion, url, setHoveredSite } = props;
    const sorted_regions = Object.keys(sitesPerRegion).sort();

    return (
        <Grid item xs={12} container justify="center">
            {
                sorted_regions.map(key => {
                    const region = key !== "inactive" ? key.toUpperCase() : "Inactive Sites";
                
                    return (
                        <Grid 
                            container justify="center"
                            key={key}
                            style={{ margin: "8px 0" }}
                        >
                            <Typography
                                variant="h6" component={Grid} 
                                item xs={12} align="center"
                                style={{ marginBottom: 4 }}
                            >
                                { 
                                    ["I", "V", "X"].includes(region.charAt(0)) && key !== "inactive"
                                        ? `Region ${region}`
                                        : region }
                            </Typography>

                            {
                                sitesPerRegion[key].map(site => (
                                    <Typography
                                        variant="body2" component={Grid}
                                        item xs={12} align="center" 
                                        key={site.site_code}
                                    >
                                        <Link
                                            to={`${url}/${site.site_code}`} 
                                            style={{ color: "black" }}
                                            onFocus={e => setHoveredSite(site.site_code)}
                                            onMouseOver={e => setHoveredSite(site.site_code)}
                                        > 
                                            {
                                                prepareSiteAddress(site, true, "start") 
                                            }
                                        </Link>
                                    </Typography>
                                ))
                            }
                        </Grid>
                    );
                })
            }
        </Grid>
    );
}

function Container (props) {
    const classes = useStyles();
    const {
        width, location,
        match: { url }
    } = props;

    const { all_sites_including_inactive: sites } = useContext(GeneralContext);
    const [hovered_site, setHoveredSite] = useState(null);
    const [site_map_data, setSiteMapData] = useState(null);
    const [sites_per_region, setSitesPerRegion] = useState(null);

    useEffect(() => {
        if (sites.length > 0) {
            const smd = [];
            const spr = {};
            sites.forEach(site => {
                const { region, active } = site;
                
                let key = region;
                if (!active) {
                    key = "inactive";
                }

                if (!spr[key]) spr[key] = [];
                spr[key].push(site);

                smd.push({
                    ...site,
                    url: `${url}/${site.site_code}`,
                });
            });

            setSiteMapData(smd);
            setSitesPerRegion(spr);
        }
    }, [sites]);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Community | Site Information"
                />
            </div>

            <div className={classes.pageContentMargin}>
                <Switch location={location}>
                    <Route exact path={url} render={
                        props => (
                            <Grid container spacing={3} justify="space-evenly">
                                <Grid item xs={12} sm={6}>
                                    {
                                        site_map_data === null ? (<MapLoader />)
                                            : (
                                                <div className={classes.sticky}>
                                                    <PhilippineMap 
                                                        siteMapData={site_map_data}
                                                        width={width}
                                                        url={url}
                                                        hoveredSite={hovered_site}
                                                    />
                                                </div>                                         
                                            )
                                    }
                                </Grid>

                                <Grid item xs={12} sm={6} container justify="center">
                                    <Typography 
                                        variant="h5" component={Grid}
                                        item xs={12} align="center"
                                        gutterBottom
                                    >
                                        <strong>Dynaslope Project Sites</strong>
                                    </Typography>

                                    {
                                        sites_per_region === null ? "Loading"
                                            : (
                                                <SitesPerRegion
                                                    sitesPerRegion={sites_per_region}
                                                    url={url}
                                                    setHoveredSite={setHoveredSite}
                                                />
                                            )
                                    }
                                </Grid>
                            </Grid>
                        )
                    }/>

                    <Route path={`${url}/:site_code`} render={
                        props => {
                            const { match: { params: { site_code } } } = props;
                            const site = sites.filter(x => x.site_code === site_code).pop();
                        
                            return <SiteInformationPage
                                {...props}
                                width={width}
                                siteInformation={site}
                            />;
                        }
                    } 
                    />
                </Switch>
            </div>
        </Fragment>
    );
}

export default withWidth()(Container);
