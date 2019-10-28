import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Typography, Grid } from "@material-ui/core";
import PhivolcsLetterHead from "../../../images/phivolcs-letter-head.png";
import PhivolcsLetterFooter from "../../../images/phivolcs-letter-footer.png";

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
    }
}));


function getHeightWithPadding (element) {
    return document.getElementById(element).offsetHeight;
}

function BulletinTemplate (props) {
    const classes = useStyle();
    const { width } = props;
    const [body_height, setBodyHeight] = useState(0);
    const content_body = useRef(null);

    const is_md = isWidthUp("md", width);

    useEffect(() => {
        const header_h = getHeightWithPadding("letter-head");
        const footer_h = getHeightWithPadding("letter-foot");
        const root_h = getHeightWithPadding("bulletin-root");
        const height = root_h - header_h - footer_h;
        setBodyHeight(height);
        console.log(`useEffect - root (${root_h}) - header (${header_h}) - footer (${footer_h}) = ${height}`);
    }, []);

    useEffect(() => {
        const { current: parent } = content_body;

        const children = Array.from(parent.children);
        let total_height = 0;
        children.forEach((node, index) => {
            if (node.id !== "subcontent") {
                total_height += node.offsetHeight;
            } else {
                const sub_children = Array.from(node.children);

                sub_children.forEach(sub => {
                    const sub_h = sub.offsetHeight;
                    if (total_height + sub_h < 629)
                        total_height += sub_h;
                    else {
                        console.log(sub);
                    }
                    console.log(total_height);
                });
            }
        });
    }, [content_body]);

    return (
        <React.Fragment>
            <div id="bulletin-root" className={classes.root}>
                <div id="letter-head" className={classes.letterHeadContainer}>
                    <img
                        src={PhivolcsLetterHead}
                        alt="PHIVOLCS Letter Head"
                        className={classes.phivolcsLetterHead}
                    />
                </div>
            
                <div id="bulletin-content" className={classes.body} ref={content_body}>  {/* style={{ height: 629, maxHeight: 629, overflowY: "hidden" }} */}
                    <Typography variant="body2" align="center" className={classes.title}>
                        <strong>DYNASLOPE LANDSLIDE ALERT LEVEL INFORMATION: TUE-2018-132</strong>
                    </Typography>

                    <Typography variant="body2" component="div" className={classes.mainInfo}>
                        <Grid container spacing={is_md ? 2 : 1}>
                            <Grid item xs={4}>
                            Location:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Brgy. Tue, Tadian, Mt. Province</strong>
                            </Grid>

                            <Grid item xs={4}>
                            Date/Time:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>August 25, 2018, 08:00 PM</strong>
                            </Grid>

                            <Grid item xs={4}>
                            Alert Level Released:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Alert 3 (Critical movement observed in sensors and as manifestation; significant movement observed in ground markers; recent rainfall may trigger landslide), valid until August 27, 2018, 12:00 NN</strong>
                            </Grid>

                            <Grid item xs={4}>
                            Recommended Response:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Evacuate the households at risk.</strong>
                            </Grid>
                        </Grid>
                    </Typography>

                    <Grid container spacing={is_md ? 2 : 1} id="subcontent">
                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>AREA SITUATION</u>:</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>GROUND MOVEMENT</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionHeader} ${classes.indent}`}>
                                <i><u>SUBSURFACE DATA</u></i>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                            Critical movement observed in sensors last <strong>August 13, 2018, 05:00 AM</strong>. Most recent re-trigger/s occurred on <strong>August 17: 02:00 AM; August 16: 07:30 PM, 03:30 PM</strong>.
                                <br /> <strong>Last trigger info:</strong> TUETA (node 1) exceeded displacement threshold
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                            Significant movement observed in sensors last <strong>August 13, 2018, 05:00 AM</strong>. Most recent re-trigger/s occurred on <strong>August 17: 02:00 AM</strong>.
                                <br /> <strong>Last trigger info:</strong> TUETA (node 1) exceeded displacement threshold
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionHeader} ${classes.indent}`}>
                                <i><u>SURFICIAL DATA</u></i>
                            </Typography>
                        </Grid>
                    
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                            Significant movement observed in ground markers last <strong>August 14, 2018, 08:17 AM</strong>.
                                <br /> <strong>Last trigger info:</strong> Marker B: 7.6 cm difference in 20.95 hrs
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>RAINFALL</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                            Accumulated rainfall exceeded threshold values last <strong>August 13, 2018, 07:30 PM</strong>. Most recent re-trigger/s occurred on <strong>August 14: 07:30 AM, 03:30 AM; August 13: 11:30 PM</strong>.
                                <br /> <strong>Last trigger info:</strong> 3-day cumulative rainfall (198.5 mm) exceeded threshold (192.07 mm)
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>HOUSEHOLDS AT RISK</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                            At least 60 households (140 residents), day care center, barangay hall, church, clinic
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>OTHER RECOMMENDATIONS</u>:</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Landslide Early Warning Committee (LEWC):</strong> Evacuate. Monitor the site at least after <strong>August 27, 2018, 11:30 AM</strong> <i>AND</i> only if conditions are safe.
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Community:</strong> Evacuate.
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>NOTE:</strong> This bulletin contains the official Alert Level and Recommended Response of the Dynaslope Project for Brgy. Tue and will hold true until a new bulletin is released.
                            </Typography>
                        </Grid>
                    </Grid>
                </div>

                <div id="letter-foot" className={`${classes.letterHeadContainer} ${classes.letterFooterContainer}`}>
                    <img
                        src={PhivolcsLetterFooter}
                        alt="PHIVOLCS Letter Footer"
                        className={classes.phivolcsLetterHead}
                    />
                </div>
            </div>

            <div id="bulletin-root-2" className={classes.root}>
                <div id="letter-head" className={classes.letterHeadContainer}>
                    <img
                        src={PhivolcsLetterHead}
                        alt="PHIVOLCS Letter Head"
                        className={classes.phivolcsLetterHead}
                    />
                </div>

                <div id="bulletin-content" className={classes.body} ref={content_body}>
                    <Typography variant="body2" align="center" className={classes.title}>
                        <strong>DYNASLOPE LANDSLIDE ALERT LEVEL INFORMATION: TUE-2018-132</strong>
                    </Typography>

                    <Typography variant="body2" component="div" className={classes.mainInfo}>
                        <Grid container spacing={is_md ? 2 : 1}>
                            <Grid item xs={4}>
                Location:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Brgy. Tue, Tadian, Mt. Province</strong>
                            </Grid>

                            <Grid item xs={4}>
                Date/Time:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>August 25, 2018, 08:00 PM</strong>
                            </Grid>

                            <Grid item xs={4}>
                Alert Level Released:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Alert 3 (Critical movement observed in sensors and as manifestation; significant movement observed in ground markers; recent rainfall may trigger landslide), valid until August 27, 2018, 12:00 NN</strong>
                            </Grid>

                            <Grid item xs={4}>
                Recommended Response:
                            </Grid>
                            <Grid item xs={8}>
                                <strong>Evacuate the households at risk.</strong>
                            </Grid>
                        </Grid>
                    </Typography>

                    <Grid container spacing={is_md ? 2 : 1} id="subcontent">
                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>AREA SITUATION</u>:</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>GROUND MOVEMENT</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionHeader} ${classes.indent}`}>
                                <i><u>SUBSURFACE DATA</u></i>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                Critical movement observed in sensors last <strong>August 13, 2018, 05:00 AM</strong>. Most recent re-trigger/s occurred on <strong>August 17: 02:00 AM; August 16: 07:30 PM, 03:30 PM</strong>.
                                <br /> <strong>Last trigger info:</strong> TUETA (node 1) exceeded displacement threshold
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                Significant movement observed in sensors last <strong>August 13, 2018, 05:00 AM</strong>. Most recent re-trigger/s occurred on <strong>August 17: 02:00 AM</strong>.
                                <br /> <strong>Last trigger info:</strong> TUETA (node 1) exceeded displacement threshold
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionHeader} ${classes.indent}`}>
                                <i><u>SURFICIAL DATA</u></i>
                            </Typography>
                        </Grid>
        
                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                Significant movement observed in ground markers last <strong>August 14, 2018, 08:17 AM</strong>.
                                <br /> <strong>Last trigger info:</strong> Marker B: 7.6 cm difference in 20.95 hrs
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>RAINFALL</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                Accumulated rainfall exceeded threshold values last <strong>August 13, 2018, 07:30 PM</strong>. Most recent re-trigger/s occurred on <strong>August 14: 07:30 AM, 03:30 AM; August 13: 11:30 PM</strong>.
                                <br /> <strong>Last trigger info:</strong> 3-day cumulative rainfall (198.5 mm) exceeded threshold (192.07 mm)
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong>HOUSEHOLDS AT RISK</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={`${classes.sectionDetails} ${classes.indent}`}>
                At least 60 households (140 residents), day care center, barangay hall, church, clinic
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionHeader}>
                                <strong><u>OTHER RECOMMENDATIONS</u>:</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Landslide Early Warning Committee (LEWC):</strong> Evacuate. Monitor the site at least after <strong>August 27, 2018, 11:30 AM</strong> <i>AND</i> only if conditions are safe.
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>For the Community:</strong> Evacuate.
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" className={classes.sectionDetails}>
                                <strong>NOTE:</strong> This bulletin contains the official Alert Level and Recommended Response of the Dynaslope Project for Brgy. Tue and will hold true until a new bulletin is released.
                            </Typography>
                        </Grid>
                    </Grid>
                </div>

                <div id="letter-foot" className={`${classes.letterHeadContainer} ${classes.letterFooterContainer}`}>
                    <img
                        src={PhivolcsLetterFooter}
                        alt="PHIVOLCS Letter Footer"
                        className={classes.phivolcsLetterHead}
                    />
                </div>
            </div>
        </React.Fragment>
    );
}

export default withWidth()(BulletinTemplate);