import React, { 
    Fragment, useState, 
    useEffect, useContext
} from "react";

import {
    Card, CardContent, CardActionArea,
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

const useStyles = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        centerer: {
            textAlign: "center"
        }
    };
});

const MyLoader = () => (
    <ContentLoader 
        height={300}
        width={684}
        speed={1}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="10" y="1" rx="0" ry="0" width="88.41" height="63" />
        <rect x="110" y="1" rx="0" ry="0" width="88.41" height="63" />
        <rect x="210" y="1" rx="0" ry="0" width="88.41" height="63" />
        <rect x="310" y="1" rx="0" ry="0" width="88.41" height="63" />
        <rect x="410" y="1" rx="0" ry="0" width="88.41" height="63" />
        <rect x="510" y="1" rx="0" ry="0" width="88.41" height="63" />

        <rect x="10" y="80" rx="0" ry="0" width="88.41" height="63" />
        <rect x="110" y="80" rx="0" ry="0" width="88.41" height="63" />
        <rect x="210" y="80" rx="0" ry="0" width="88.41" height="63" />
        <rect x="310" y="80" rx="0" ry="0" width="88.41" height="63" />
        <rect x="410" y="80" rx="0" ry="0" width="88.41" height="63" />
        <rect x="510" y="80" rx="0" ry="0" width="88.41" height="63" />

        <rect x="10" y="159" rx="0" ry="0" width="88.41" height="63" />
        <rect x="110" y="159" rx="0" ry="0" width="88.41" height="63" />
        <rect x="210" y="159" rx="0" ry="0" width="88.41" height="63" />
        <rect x="310" y="159" rx="0" ry="0" width="88.41" height="63" />
        <rect x="410" y="159" rx="0" ry="0" width="88.41" height="63" />
        <rect x="510" y="159" rx="0" ry="0" width="88.41" height="63" />

        <rect x="10" y="238" rx="0" ry="0" width="88.41" height="63" />
        <rect x="110" y="238" rx="0" ry="0" width="88.41" height="63" />
        <rect x="210" y="238" rx="0" ry="0" width="88.41" height="63" />
        <rect x="310" y="238" rx="0" ry="0" width="88.41" height="63" />
        <rect x="410" y="238" rx="0" ry="0" width="88.41" height="63" />
        <rect x="510" y="238" rx="0" ry="0" width="88.41" height="63" />
    </ContentLoader>
);

const MapLoader = () => (
    <ContentLoader 
        height={300}
        width={684}
        speed={1}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="10" y="1" rx="0" ry="0" width="561" height="700" />
    </ContentLoader>
);

function prepareSiteMapData (sites, url, setSiteInformation) {
    return sites.map((site, index) => {
        return {
            ...site,
            url: `${url}/${site.site_code}`,
            onClickHandler: setSiteInformation(site)
        };
    });
}

function createSiteCards (sites, url, setSiteInformation) {
    return sites.map((site, index) => {
        // const { 
        //     site_id, site_code, purok,
        //     sitio, barangay, municipality,
        //     province, region, active,
        //     psgc, households, season            
        // } = site;
        const { site_code } = site;

        // const address = prepareSiteAddress(site, true, "start");

        return (
            <Grid item xs={4} sm={3} lg={2} key={`card_grid_${index + 1}`}>
                <Link 
                    to={`${url}/${site_code}`} 
                    style={{ textDecoration: "none", color: "black" }} 
                    onClick={ret => setSiteInformation(site)}
                >
                    <Card className="alert-card">
                        {/* <CardActionArea onClick={handleClickOpen(index)}> */}
                        <CardActionArea>
                            <CardContent style={{ paddingBottom: 16 }}>
                                {/* <Typography className="card-title" color="textSecondary" gutterBottom>
                                    {timestamp}
                                </Typography> */}
                                <Typography variant="h5" component="h2" align="center">
                                    {site_code.toUpperCase()}
                                </Typography>
                                {/* <Typography className="card-internal-alert" color="textSecondary">
                                        {internal_alert}
                                    </Typography> */}
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Link>
            </Grid>
        );
    });
}

function SitesInformationContainer (props) {
    const classes = useStyles();
    const {
        width, location,
        match: { url }
    } = props;

    const { sites } = useContext(GeneralContext);

    const [siteInformation, setSiteInformation] = useState(null);
    const [site_cards_list, setSiteCardsList] = useState(null);
    const [siteMapData, setSiteMapData] = useState(null);

    useEffect(() => {
        const site_cards = createSiteCards(sites, url, setSiteInformation);
        setSiteCardsList(site_cards);

        const site_map = prepareSiteMapData(sites, url, setSiteInformation);
        setSiteMapData(site_map);
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
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    {
                                        siteMapData === null ? (<MapLoader />)
                                            : (
                                                <PhilippineMap 
                                                    siteMapData={siteMapData}
                                                />                                                
                                            )
                                    }
                                </Grid>
                                <Grid item xs={12} sm={6} container spacing={1}>
                                    {
                                        site_cards_list === null ? (<MyLoader />)
                                            : (site_cards_list)
                                    }
                                </Grid>
                            </Grid>
                        )
                    }/>

                    <Route path={`${url}/:site_code`} render={
                        props => <SiteInformationPage
                            {...props}
                            width={width}
                            siteInformation={siteInformation}
                        />} 
                    />
                </Switch>
            </div>
        </Fragment>
    );
}

export default withWidth()(SitesInformationContainer);