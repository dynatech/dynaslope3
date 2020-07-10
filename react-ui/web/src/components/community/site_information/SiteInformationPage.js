import React, {
    Fragment, useState, useEffect
} from "react";

import {
    Grid, Typography,
    Button, makeStyles, Card,
    CardContent
} from "@material-ui/core";
import { responsiveFontSizes } from "@material-ui/core/styles";
import { Edit } from "@material-ui/icons";
import ContentLoader from "react-content-loader";

import moment from "moment";

import GeneralStyles from "../../../GeneralStyles";
import SiteStakeholdersList from "./SiteStakeholdersList";
import BackToMainButton from "./BackToMainButton";
import { prepareSiteAddress, capitalizeFirstLetter, monthSorter } from "../../../UtilityFunctions";
import { getSiteSeason, getSeasons } from "../ajax";
import EditSiteInformationModal from "./EditSiteInformationModal";

const useStyles = makeStyles(theme => {
    const temp = responsiveFontSizes(theme);
    return GeneralStyles(temp);
});

const MyLoader = () => (
    <ContentLoader 
        height={125}
        width={380}
        speed={2}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
    >
        <rect x="129" y="20" rx="3" ry="3" width="123" height="44" /> 
        <rect x="18" y="80" rx="3" ry="3" width="350" height="22" />
    </ContentLoader>
);

function SiteInformationPage (props) {
    const { 
        width, siteInformation
    } = props;
    const classes = useStyles();

    const [site, setSite] = useState(null);
    const [season_months, setSeasonMonths] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [routine_schedule, setRoutineSchedule] = useState([]);
    const [isOpenEditModal, setIsEditModal] = useState(false);

    useEffect(() => {
        if (typeof siteInformation !== "undefined") {
            setSite(siteInformation);
        }
    }, [siteInformation]);

    useEffect(() => {
        if (site !== null) {
            getSeasons(data => {
                setSeasons(data);
            });

            getSiteSeason(site.site_code, data => {
                const { season_months: sm } = data;
                const { routine_schedules: rs } = sm;

                const c_dry = [];
                const c_wet = [];
                rs.forEach(row => {
                    const day = moment().isoWeekday(row.iso_week_day)
                    .format("dddd");
                    if (row.season_type === "d") c_dry.push(day);
                    else c_wet.push(day);
                });

                const c_list = [
                    { key: "dry", list: c_dry },
                    { key: "wet", list: c_wet }
                ];

                setRoutineSchedule(c_list);

                delete sm.routine_schedules;
                delete sm.season_group_id;
                
                const dry = [];
                const wet = [];
                
                Object.keys(sm).forEach(key => {
                    if (sm[key] === "d") dry.push(key);
                    else wet.push(key);
                });

                monthSorter(dry);
                monthSorter(wet);

                const list = [
                    { key: "dry", list: dry },
                    { key: "wet", list: wet }
                ];

                setSeasonMonths(list);
            });
        }
    }, [site]);

    const editButtonAction = () => {
        setIsEditModal(!isOpenEditModal);
    };

    return (
        <Fragment>
            <Grid 
                container spacing={2} 
                justify="space-between"
                alignItems="stretch"
            >
                <Grid item xs>
                    <BackToMainButton {...props} width={width} />
                </Grid>

                <Grid item xs container justify="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={editButtonAction}
                        startIcon={<Edit />}
                    >
                        Edit Info
                    </Button>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                {
                    site !== null ? (
                        <Fragment>
                            <Grid item xs={12} align="center">
                                <Typography variant="h4">
                                    { site.site_code.toUpperCase() }
                                </Typography>
                                <Typography variant="h5" color="textSecondary">
                                    { prepareSiteAddress(site, false) }
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <Card raised>
                                    <CardContent>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12} align="center">
                                                <Typography variant="h6" color="textPrimary">
                                                    <strong>Geographic Information</strong>
                                                </Typography>
                                            </Grid>

                                            <Grid item xs align="center">
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Region
                                                </Typography>
                                                <Typography variant="subtitle1" color="textPrimary">
                                                    { site.region }
                                                </Typography>
                                            </Grid>

                                            <Grid item xs sm={9} md={8} lg align="center">
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Philippine Standard Geographic Code
                                                </Typography>
                                                <Typography variant="subtitle1" color="textPrimary">
                                                    { site.psgc }
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} align="center" container spacing={1}>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" color="textSecondary">
                                                        Seasons
                                                    </Typography>
                                                </Grid>

                                                {
                                                    season_months.length > 0 && (
                                                        season_months.map(row => {
                                                            const { key, list } = row;

                                                            return (
                                                                <Grid item xs={6} key={key}>
                                                                    <Typography variant="subtitle2" color="textSecondary">
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
                                                    )
                                                }
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} container alignItems="center">
                                <Card raised style={{ width: "100%" }}>
                                    <CardContent>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12} align="center">
                                                <Typography variant="h6" color="textPrimary">
                                                    <strong>Monitoring Information</strong>
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} align="center" container spacing={1}>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" color="textSecondary">
                                                        Routine Schedules
                                                    </Typography>
                                                </Grid>

                                                {
                                                    routine_schedule.length > 0 && (
                                                        routine_schedule.map(row => {
                                                            const { key, list } = row;

                                                            return (
                                                                <Grid item xs={6} key={key}>
                                                                    <Typography variant="subtitle2" color="textSecondary">
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
                                                    )
                                                }
                                            </Grid>

                                            <Grid item xs align="center">
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Current Alert Level
                                                </Typography>
                                                <Typography variant="subtitle1" color="textPrimary">
                                                    ---
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12}>
                                <Card raised>
                                    <CardContent>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12} align="center">
                                                <Typography variant="h6" color="textPrimary">
                                                    <strong>Site Status</strong>
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} sm align="center">
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Active
                                                </Typography>
                                                <Typography variant="subtitle1" color="textPrimary">
                                                    { site.active ? "Yes" : "No" }
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} sm align="center">
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Elements at Risk
                                                </Typography>
                                                <Typography variant="subtitle1" color="textPrimary">
                                                    { site.households || "---" }
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} align="center">
                                <Card raised style={{ width: "100%" }}>
                                    <CardContent>
                                        <SiteStakeholdersList siteCode={site.site_code} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Fragment>
                    ) : (
                        <Grid item xs style={{ width: "100%" }}>
                            <MyLoader />
                        </Grid>
                    )
                }
            </Grid>

            <EditSiteInformationModal
                isOpen={isOpenEditModal}
                siteInformation={siteInformation}
                editButtonAction={editButtonAction}
                seasons={seasons}
            />
        </Fragment>
    );
}

export default SiteInformationPage;
