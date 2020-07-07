import React, {
    Fragment, useState, useEffect,
    useContext 
} from "react";

import {
    withStyles, Grid, Typography,
    Divider, Button,
} from "@material-ui/core";
import { 
    Edit
} from "@material-ui/icons";
import ContentLoader from "react-content-loader";

import moment from "moment";

import GeneralStyles from "../../../GeneralStyles";
// import SiteInformationSheet from "./SiteInformationSheet";
// import SiteCurrentStatus from "./SiteCurrentStatus";
import SiteStakeholdersList from "./SiteStakeholdersList";
// import SiteEventsTable from "./SiteEventsTable";
import BackToMainButton from "./BackToMainButton";
import { GeneralContext } from "../../contexts/GeneralContext";
import { prepareSiteAddress, capitalizeFirstLetter, monthSorter } from "../../../UtilityFunctions";
import { getSiteSeason, getSeasons } from "../ajax";
import EditSiteInformationModal from "./EditSiteInformationModal";

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
        classes, width, 
        match: { params: { site_code } },
        siteInformation
    } = props;

    const { sites } = useContext(GeneralContext);

    const [site, setSite] = useState(null);
    const [season_months, setSeasonMonths] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [routine_schedule, setRoutineSchedule] = useState([]);
    const [isOpenEditModal, setIsEditModal] = useState(false);

    // const [site_as_title, setSiteAsTitle] = useState("");
    // const [local_site_information, setLocalSiteInformation] = useState({});
    // const [siteIdToPass, setSiteIdToPass] = useState("");

    useEffect(() => {
        if (typeof siteInformation === "undefined") {
            for (let i = 0; i < sites.length; i += 1) {
                if (sites[i].site_code === site_code) {
                    setSite(sites[i]);
                    break;
                }
            }
        } else {
            setSite(siteInformation);
        }

        // setLocalSiteInformation(siteInformation);
        // setSiteIdToPass(siteInformation.site_id);

        // const no_site_info_provided = typeof local_site_information.site_code === "undefined" || 
        // local_site_information.site_code === "";
        // if (no_site_info_provided) {
        //     getSites(site_code, ret => {
        //         setLocalSiteInformation(ret);
        //         setSiteIdToPass(ret.site_id);
        //         setSiteAsTitle(site_code.toUpperCase());
        //     });
        // }
    }, [siteInformation, sites]);

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
                <Grid container item xs={12} style={{ marginBottom: 16 }}>
                    <Grid item sm>
                        <BackToMainButton {...props} width={width} />
                    </Grid>
                    {/* <Grid item sm container justify="flex-end">
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={editButtonAction}
                            startIcon={<Edit />}>
                            Edit
                        </Button>
                    </Grid> */}
                </Grid>
            </Grid>
            {/* <div style={{ display: "flex", justifyContent: "space-between" }}>
                <BackToMainButton {...props} width={width} />
            </div> */}

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
                        
                            <Grid item xs={12}>
                                <Divider className={classes.divider}/>
                            </Grid>
                            
                            <Grid item xs={6} container spacing={1}>
                                <Grid item xs={12} align="center">
                                    <Typography variant="h6" color="textPrimary">
                                        <strong>Geographic Information</strong>
                                    </Typography>
                                </Grid>

                                <Grid item xs align="center">
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Philippine Standard<br/>Geographic Code
                                    </Typography>
                                    <Typography variant="subtitle1" color="textPrimary">
                                        { site.psgc }
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

                                <Grid item xs={12} align="center" container spacing={0}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Seasons
                                        </Typography>
                                    </Grid>

                                    {
                                        season_months.length > 0 && (
                                            season_months.map(row => {
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
                                        )
                                    }
                                </Grid>
                            </Grid>

                            <Grid item xs={6} container spacing={1}>
                                <Grid item xs={12} align="center">
                                    <Typography variant="h6" color="textPrimary">
                                        <strong>Monitoring Information</strong>
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} align="center" container spacing={0}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Routine Schedules
                                        </Typography>
                                    </Grid>

                                    {
                                        routine_schedule.length > 0 && (
                                            routine_schedule.map(row => {
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

                            <Grid item xs={12} align="center">
                                <SiteStakeholdersList siteCode={site.site_code} />
                            </Grid>
                            {/* <Fragment>
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
                    </Grid>
                </Fragment> */
                            }
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

export default withStyles(GeneralStyles)(SiteInformationPage);