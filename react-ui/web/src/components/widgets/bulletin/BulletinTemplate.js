import React, { useState, useEffect, useRef, Fragment } from "react";
import { makeStyles } from "@material-ui/core/styles";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Typography, Grid, Divider } from "@material-ui/core";
import PhivolcsLetterHead from "../../../images/phivolcs-letter-head.png";
import PhivolcsLetterFooter from "../../../images/phivolcs-letter-footer.png";
import { getBulletinDetails } from "./ajax";
import { prepareSiteAddress } from "../../../UtilityFunctions";

const useStyle = makeStyles(theme => ({
    root: {
        // width: 1240, // 1240, // 2480 // 595,
        // height: 1753, // 150dpi - 1753, // 300dpi - 3508, // 72dpi - 842,
        // backgroundColor: "antiquewhite",
        // border: "0.5px solid black"
    },
    letterHeadContainer: {
        width: "inherit",
        height: "auto",
        boxSizing: "border-box",
        padding: "28px 44px",
        [theme.breakpoints.only("md")]: {
            padding: "58.3324px 91.6652px",
        },
        [theme.breakpoints.up("lg")]: {
            padding: "116.6648px 183.3304px",
        }
    },
    letterFooterContainer: {
        paddingTop: 0,
        marginTop: 16,
        [theme.breakpoints.only("md")]: {
            marginTop: "33.3328px",
        },
        [theme.breakpoints.up("lg")]: {
            marginTop: "66.6656px",
        }
        // position: "absolute", 
        // bottom: 0
    },
    phivolcsLetterHead: {
        maxWidth: "100%",
        maxHeight: "100%",
        height: "auto"
    },
    body: {
        padding: "0 44px",
        height: 629, maxHeight: 629,
        overflowY: "hidden",
        [theme.breakpoints.only("md")]: {
            padding: "0 91.6652px",
            height: 1310.3957, maxHeight: 1310.3957
        },
        [theme.breakpoints.up("lg")]: {
            padding: "0 183.3304px",
            height: 2620.7914, maxHeight: 2620.7914
        }
    },
    title: {
        marginBottom: 16,
        fontSize: "0.875rem",
        [theme.breakpoints.only("md")]: {
            marginBottom: 33.3328,
            fontSize: "1.82288750rem"
        },
        [theme.breakpoints.up("lg")]: {
            marginBottom: 66.6656,
            fontSize: "3.64576800rem"
        }
    },
    mainInfo: {
        border: "0.5px solid black",
        padding: "8px 12px",
        fontSize: "0.65rem",
        letterSpacing: 0,
        marginBottom: 12,
        [theme.breakpoints.only("md")]: {
            padding: "16.6664px 24.9996px",
            fontSize: "1.354145rem",
            marginBottom: 24.9996
        },
        [theme.breakpoints.up("lg")]: {
            padding: "33.3328px 49.9992px",
            fontSize: "2.70829rem",
            marginBottom: 49.9992
        }
    },
    sectionHeader: {
        fontSize: "0.7rem",
        [theme.breakpoints.only("md")]: {
            fontSize: "1.45831rem"
        },
        [theme.breakpoints.up("lg")]: {
            fontSize: "2.91662rem"
        }
    },
    sectionDetails: {
        fontSize: "0.65rem",
        [theme.breakpoints.only("md")]: {
            fontSize: "1.354145rem"
        },
        [theme.breakpoints.up("lg")]: {
            fontSize: "2.70829rem"
        }
    },
    indent: {
        marginLeft: 24,
        [theme.breakpoints.only("md")]: {
            marginLeft: 49.9992
        },
        [theme.breakpoints.up("lg")]: {
            marginLeft: 99.9984
        }
    },
    divider: { margin: "12px 0px 2px" },
    releaseDetailsArea: {
        display: "flex",
        justifyContent: "space-between"
    }
}));


function getHeightWithMargin (element, margin_only = false) {
    const { offsetHeight: offset } = element;
    const { marginBottom, marginTop } = getComputedStyle(element);
    const margins = parseFloat(marginBottom) + parseFloat(marginTop);
    if (margin_only) return margins;
    return offset + margins;
}

function LetterHead (props) {
    const { classes } = props;
    return (
        <div id="letter-head" className={classes.letterHeadContainer}>
            <img
                src={PhivolcsLetterHead}
                alt="PHIVOLCS Letter Head"
                className={classes.phivolcsLetterHead}
            />
        </div>
    );
}

function LetterFooter (props) {
    const { classes } = props;
    return (
        <div id="letter-foot" className={`${classes.letterHeadContainer} ${classes.letterFooterContainer}`}>
            <img
                src={PhivolcsLetterFooter}
                alt="PHIVOLCS Letter Footer"
                className={classes.phivolcsLetterHead}
            />
        </div>
    );
}

function TitleAndMainInfo (props) {
    const { classes, bulletinDetail, isMD } = props;

    const {
        bulletin_control_code, site_address, data_ts,
        alert_description_group, recommended_response
    } = bulletinDetail;

    return (
        <Fragment>
            <Typography variant="body2" align="center" className={classes.title}>
                <strong>DYNASLOPE LANDSLIDE ALERT LEVEL INFORMATION: {bulletin_control_code}</strong>
            </Typography>

            <Typography variant="body2" component="div" className={classes.mainInfo}>
                <Grid container spacing={isMD ? 2 : 1}>
                    <Grid item xs={4}>Location:</Grid>
                    <Grid item xs={8}><strong>{site_address}</strong></Grid>

                    <Grid item xs={4}>Date/Time:</Grid>
                    <Grid item xs={8}><strong>{data_ts}</strong></Grid>

                    <Grid item xs={4}>Alert Level Released:</Grid>
                    <Grid item xs={8}><strong>{alert_description_group}</strong></Grid>

                    <Grid item xs={4}>Recommended Response:</Grid>
                    <Grid item xs={8}><strong>{recommended_response}</strong></Grid>
                </Grid>
            </Typography>
        </Fragment>
    );
}

function BulletinTemplate (props) {
    const classes = useStyle();
    const { width, match: { params: { release_id } } } = props;
    const [excess_divs, setExcessDivs] = useState([]);
    const [is_loaded, setIsLoaded] = useState(false);
    const content_body = useRef(null);
    const [bulletin_detail, setBulletinDetails] = useState({
        site: {},
        alert_level: 0,
        bulletin_control_code: "",
        site_address: "",
        alert_description_group: "",
        recommended_response: "",
        community_response: "",
        lewc_lgu_response: "",
        households_at_risk: "",
        has_ground_trigger: false,
        ground_movement_details: "",
        prepared_triggers: [],
        no_data_triggers: [],
        publishers: "",
        next_ewi_release_ts: ""
    });
    const {
        alert_level,
        community_response, households_at_risk,
        lewc_lgu_response, prepared_triggers, has_ground_trigger,
        site: { barangay }, no_data_triggers, publishers,
        next_ewi_release_ts, ground_movement_details
    } = bulletin_detail;

    const is_md = isWidthUp("md", width);

    useEffect(() => {
        getBulletinDetails(release_id, data => {
            const { site } = data;
            const site_address = prepareSiteAddress(site, false);

            const details = {
                ...data,
                site_address
            };

            setBulletinDetails(details);
        });
    }, []);

    useEffect(() => {
        const { current: parent } = content_body;
        const children = Array.from(parent.children);
        let total_height = 0;
        children.forEach((node, index) => {
            if (node.id !== "subcontent") {
                total_height += getHeightWithMargin(node);
            } else {
                total_height += getHeightWithMargin(node, true);

                const sub_children = Array.from(node.children);
                const excess = [];
                sub_children.forEach(sub => {
                    const sub_h = getHeightWithMargin(sub);
                    if (total_height + sub_h < 1310.3957) { // 629
                        total_height += sub_h;
                    } else {
                        total_height += sub_h;
                        excess.push(sub);
                        sub.setAttribute("style", "display: none");
                    }
                });

                setExcessDivs(excess);
            }
        });

        if (bulletin_detail.site_address !== "") setIsLoaded(true);
    }, [bulletin_detail]);

    let is_ground_movement_section_printed = false;
    return (
        <Fragment>
            <div id="bulletin-root" className={classes.root}>
                <LetterHead classes={classes} />
            
                <div id="bulletin-content" className={classes.body} ref={content_body}> 
                    <TitleAndMainInfo 
                        classes={classes} 
                        bulletinDetail={bulletin_detail}
                        isMD={is_md}
                    />

                    <Grid container spacing={is_md ? 2 : 1} id="subcontent">
                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>AREA SITUATION</u>:</strong>
                            </Typography>
                        </Grid>

                        {
                            prepared_triggers.map((row, i, arr) => {
                                const {
                                    is_ground,
                                    trigger_source: curr_trig_source
                                } = row;

                                let GroundMovementHeaderComponent = "";
                                if (!is_ground_movement_section_printed && is_ground) {
                                    GroundMovementHeaderComponent = (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" className={classes.sectionHeader}>
                                                <strong>GROUND MOVEMENT</strong>
                                            </Typography>
                                        </Grid>
                                    );
                                    is_ground_movement_section_printed = true;
                                }

                                let to_print_header = false;
                                if (i === 0) to_print_header = true;
                                else if (arr[i - 1].trigger_source !== curr_trig_source)
                                    to_print_header = true;

                                
                                let HeaderComponent = "";
                                if (to_print_header) {
                                    const uc_trig_source = curr_trig_source.toUpperCase();
                                    HeaderComponent = (
                                        <Grid item xs={12}>
                                            <Typography
                                                variant="body2"
                                                className={`${classes.sectionHeader} ${is_ground ? classes.indent : ""}`}
                                            >
                                                <strong>{
                                                    is_ground ? <u><i>{uc_trig_source}</i></u>
                                                        : uc_trig_source
                                                }</strong>
                                            </Typography>
                                        </Grid>
                                    );
                                }
                                
                                let NoDataComponent = "";
                                if (no_data_triggers.includes(curr_trig_source)) {
                                    if ((!to_print_header && is_ground) || !is_ground) {
                                        NoDataComponent = (
                                            <Grid item xs={12} style={{ paddingTop: "0 !important" }}>
                                                <Typography 
                                                    variant="body2" 
                                                    className={`${classes.sectionDetails} ${classes.indent}`}
                                                >
                                                    Currently, no data available.
                                                </Typography>
                                            </Grid>
                                        );
                                    }
                                }

                                return (
                                    <Fragment key={i}>
                                        { GroundMovementHeaderComponent }
                                        { HeaderComponent }
                                        <Grid item xs={12}>
                                            <Typography 
                                                variant="body2" 
                                                className={`${classes.sectionDetails} ${classes.indent}`}
                                                dangerouslySetInnerHTML={{ __html: row.description }}
                                            />
                                        </Grid>
                                        { NoDataComponent }
                                    </Fragment>
                                );
                            })
                        }

                        {
                            (!has_ground_trigger || alert_level === 0) && (
                                <Fragment>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" className={classes.sectionHeader}>
                                            <strong>GROUND MOVEMENT</strong>
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            className={`${classes.sectionDetails} ${classes.indent}`}
                                        >
                                            {ground_movement_details}
                                        </Typography>
                                    </Grid>
                                </Fragment>
                            )
                        }

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>HOUSEHOLDS AT RISK</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                                {households_at_risk}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>OTHER RECOMMENDATIONS</u>:</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Landslide Early Warning Committee (LEWC):</strong> <span dangerouslySetInnerHTML={{ __html: lewc_lgu_response }} /> 
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Community:</strong> {community_response}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>NOTE:</strong> This bulletin contains the official Alert Level and Recommended Response of the Dynaslope Project for Brgy. {barangay} and will hold true until a new bulletin is released.
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider className={classes.divider} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography 
                                component="div"
                                variant="body2" 
                                className={`${classes.sectionDetails} ${classes.releaseDetailsArea}`}
                            >
                                {
                                    alert_level === 0 ? <span/>
                                        : <span>Next bulletin on: <strong>{next_ewi_release_ts}</strong></span>
                                }
                                <span>Released by: <strong>{publishers}</strong></span>
                            </Typography>
                        </Grid>
                    </Grid>
                </div>

                <LetterFooter classes={classes} />
            </div>

            {
                excess_divs.length > 0 && (
                    <div id="bulletin-root-2" className={classes.root}>
                        <LetterHead classes={classes} />
            
                        <div id="bulletin-content" className={classes.body} ref={content_body}> 
                            <TitleAndMainInfo 
                                classes={classes} 
                                bulletinDetail={bulletin_detail}
                                isMD={is_md}
                            />

                            <Grid container spacing={is_md ? 2 : 1} id="excess-content">
                                {
                                    excess_divs.map((row, i) => (
                                        <Grid
                                            key={i}
                                            item xs={12} 
                                            dangerouslySetInnerHTML={{ __html: row.innerHTML }}
                                        />
                                    ))
                                }
                            </Grid>
                        </div>

                        <LetterFooter classes={classes} />
                    </div>
                )
            }

            {
                is_loaded && <div id="is-loaded" />
            }
        </Fragment>
    );
}

export default withWidth()(BulletinTemplate);