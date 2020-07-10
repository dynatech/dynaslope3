import React, { Fragment, useState, useContext } from "react";
import {
    Grid, Typography,
    Divider, Button
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { isWidthUp } from "@material-ui/core/withWidth";
import ContentLoader from "react-content-loader";

import moment from "moment";

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import { Publish, Description, PhoneAndroid, Done, Timeline } from "@material-ui/icons";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import GeneralStyles from "../../../GeneralStyles";
import ValidationModal from "./ValidationModal";
import useModal from "../../reusables/useModal";
import BulletinModal from "../../widgets/bulletin/BulletinModal";
import { getEWIMessage, getRoutineEWIMessage } from "../ajax";
import SendEwiSmsModal from "./SendEwiSmsModal";
import SendRoutineEwiSmsModal from "./SendRoutineEwiSmsModal";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { CTContext } from "./CTContext";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";

const useStyles = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        root: {
            width: "100%",
        },
        sectionHead: {
            ...general_styles.sectionHead,
            marginBottom: 24
        },
        expansionPanelSummaryContent: { justifyContent: "space-between" },
        invalidCandidate: {
            background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)"
        },
        validCandidate: {
            background: "linear-gradient(315deg, #00b712 0%, #5aff15 74%)"
        },
        partialInvalidCandidate: {
            background: "linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%)"
        },
        inputWidth: { width: "50%" },
    };
});

function format_ts (ts) {
    return moment(ts).format("DD MMMM YYYY, HH:mm");
}

const MyLoader = () => (
    <ContentLoader 
        height={60}
        width={700}
        speed={0.5}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="-4" y="5" rx="4" ry="4" width="700" height="111" /> 
    </ContentLoader>
);

function CandidateAlertsExpansionPanel (props) {
    const { 
        alertData, classes, expanded,
        handleExpansion, index, releaseFormOpenHandler,
        isShowingValidation, toggleValidation, validationDetails
    } = props;
    const { sites } = useContext(GeneralContext);
    let site = "";
    let ts = "";
    let ia_level = "";
    let trigger_arr = [];
    let has_new_triggers = false;
    const {
        general_status, is_release_time,
        unresolved_moms_list
    } = alertData;
    const routine_a0 = [];
    const routine_nd = [];
    let routine_overdue = [];

    const { validity_status: vs } = alertData;
    let validity_status = "valid";
    if (typeof vs !== "undefined") {
        validity_status = vs;
    }
    
    if (general_status === "routine") {
        const { data_ts, public_alert_symbol, overdue_routine_list, routine_details } = alertData;
        site = "ROUTINE RELEASE";
        ts = format_ts(data_ts);
        ia_level = public_alert_symbol;
        routine_overdue = overdue_routine_list;
        routine_details.forEach(el => {
            if (el.internal_alert_level === "ND" && sites !== null) {
                el.site_id_list.forEach( id => {
                    const r_site = sites.filter( row => {
                        return row.site_id === id;
                    });
                    routine_nd.push(r_site[0]);
                });
            }
            if (el.internal_alert_level === "A0" && sites !== null) {
                el.site_id_list.forEach( id => {
                    const r_site = sites.filter( row => {
                        return row.site_id === id;
                    });
                    routine_a0.push(r_site[0]);
                });
            }
            
        });
        
    } else {
        const { 
            site_code, release_details, internal_alert_level,
            trigger_list_arr
        } = alertData;
        const { data_ts } = release_details;
        site = site_code;
        ts = format_ts(data_ts);
        ia_level = internal_alert_level;
        trigger_arr = typeof trigger_list_arr === "undefined" ? [] : trigger_list_arr;
        has_new_triggers = trigger_arr !== "No new triggers" && trigger_arr.length > 0;
    }
    site = site.toUpperCase();
    const gen_status = general_status.toUpperCase();

    let root_style = classes.alert0;
    if (validity_status === "invalid") root_style = classes.alert3;
    else if (validity_status === "partially valid") root_style = classes.alert2;

    return (
        <ExpansionPanel
            key={`panel-${index + 1}`}
            expanded={expanded === `panel${index}`}
            onChange={handleExpansion(`panel${index}`)}
        >
            <ExpansionPanelSummary
                // expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}bh-content`}
                id={`panel${index}bh-header`}
                classes={{
                    content: classes.expansionPanelSummaryContent,
                    root: root_style
                }}
            >
                {
                    [site, ts, validity_status.toUpperCase(), gen_status].map((elem, i) => (
                        <Typography
                            key={`candidate-column-${i + 1}`}
                            color="textSecondary"
                            variant="body2"
                        >
                            {elem}
                        </Typography>
                    ))
                }
            </ExpansionPanelSummary>
            <Divider style={{ marginBottom: 12 }} />
            <ExpansionPanelDetails>

                <Grid container spacing={1}>
                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Data Timestamp:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{ts}</Typography>
                        </Grid>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Internal Alert:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{ia_level}</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>

                    <Grid item xs={12} container spacing={1}>
                        { gen_status === "ROUTINE" ?
                            (
                                <Grid item xs={12} container spacing={2} justify="space-between">
                                    <Grid item container xs={12} md={12}>
                                        <Grid item xs={12}>
                                            <Typography variant="h6">
                                                <strong>A0</strong>
                                            </Typography>
                                        </Grid>
                                        { routine_a0.length > 0 ? 
                                            (
                                                routine_a0.map( row => {
                                                    return (
                                                        <Grid item md={1} xs={2} key={row.site_code} style={{ padding: 3 }} >
                                                            <Typography 
                                                                variant="body1"> 
                                                                {row.site_code.toUpperCase()}
                                                            </Typography>
                                                        </Grid>
                                                    );
                                                })
                                            ) : 
                                            (
                                                <Typography variant="subtitle2">None</Typography>
                                            )
                                        }
                                    </Grid>

                                    <Grid item container xs={12} md={12} alignItems="center" >
                                        <Grid item xs={12}>
                                            <Typography variant="h6">
                                                <strong>ND</strong>
                                            </Typography>
                                        </Grid>
                                        { routine_nd.length > 0 && typeof routine_nd !== "undefined" ? 
                                            ( 
                                                routine_nd.map( row => {
                                                    return (
                                                        <Grid item md={1} xs={2} key={row.site_id} style={{ padding: 3 }} >
                                                            <Typography 
                                                                variant="body1"> 
                                                                {row.site_code.toUpperCase()}
                                                            </Typography>
                                                        </Grid>
                                                    );
                                                })
                                            )
                                            : 
                                            (
                                                <Typography variant="subtitle2">None</Typography>
                                            )
                                        }
                                    </Grid>
                                    
                                    <Grid item container xs={12} md={12} >
                                        { routine_overdue.length > 0 && (
                                            <Grid item xs={12} className={classes.routineSitesContainer}>
                                            
                                                <Typography variant="h6">
                                                    <strong> Overdue</strong>
                                                </Typography>
                                            </Grid>
                                        ) && (
                                            routine_overdue.map( row => {
                                                return (
                                                    <Grid item md={1} xs={2} key={row.site_code} style={{ justifyItems: "center", padding: 3 }} >
                                                        <Typography 
                                                            variant="body1"> 
                                                            {row.site_code.toUpperCase()}
                                                        </Typography>
                                                    </Grid>
                                                );
                                            })
                                        )
                                        }
                                    </Grid>
                                </Grid> 
                            ) 
                            : 
                            (
                                <div>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textPrimary">TRIGGERS</Typography>
                                    </Grid>
                       
                                    <Grid item xs={12} container spacing={2} alignItems="center">
                                        {
                                            has_new_triggers ? (
                                                trigger_arr.map((trigger, key) => {
                                                    const { 
                                                        ts_updated, alert, tech_info,
                                                        trigger_id, trigger_type
                                                    } = trigger;

                                                    const formatted_ts = format_ts(ts_updated);
                                                    let trigger_validity = "Valid";
                                                    let to_validate = false;
                                                    let is_validating = false;

                                                    try {
                                                        const { validating_status } = trigger;
                                                        if (validating_status === 0) {
                                                            trigger_validity = "Validating";
                                                            is_validating = true;
                                                            to_validate = true;
                                                        } else if (validating_status === null) {
                                                            trigger_validity = "---";
                                                            to_validate = true;
                                                        } else if (validating_status === 1) {
                                                            to_validate = false;
                                                        }
                                                    } catch (err) { /* pass */ }

                                                    try {
                                                        const { invalid } = trigger;
                                                        if (invalid) {
                                                            trigger_validity = "Invalid";
                                                        }
                                                    } catch (err) { /* pass */ }

                                                    const to_show_validate_button = ["surficial", "rainfall", "subsurface"].includes(trigger_type) && to_validate;

                                                    return (
                                                        <Fragment key={`trigger-${trigger_type}-${alert}`}>
                                                            <Grid item xs align="center">
                                                                <Typography variant="body1" color="textSecondary">Trigger</Typography>
                                                                <Typography variant="body1" color="textPrimary">{alert}</Typography>
                                                            </Grid>

                                                            <Grid item xs={4} align="center">
                                                                <Typography variant="body1" color="textSecondary">Trigger timestamp</Typography>
                                                                <Typography variant="body1" color="textPrimary">{formatted_ts}</Typography>
                                                            </Grid>

                                                            {/* 
                                                    NOTE: Pwedeng ipakita, pwedeng hindi, commented out just in case need
                                                    <Grid item xs={6} align="center">
                                                        <Typography variant="body1" color="textSecondary">Tech Info</Typography>
                                                        <Typography variant="body1" color="textPrimary">{tech_info}</Typography>
                                                    </Grid> 
                                                */}

                                                            <Grid item xs align={to_show_validate_button ? "flex-start" : "center"}>
                                                                <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Status:</Typography>
                                                                <Typography component="span" variant="body1" color="textPrimary">{trigger_validity}</Typography>
                                                            </Grid>

                                                            {
                                                                to_show_validate_button && (
                                                                    <Grid item xs justify="flex-end" container>
                                                                        <Button
                                                                            onClick={toggleValidation(true, {
                                                                                site, trigger_id, ts_updated
                                                                            })}
                                                                            variant="contained" color="secondary"
                                                                            size="small" aria-label="Validate trigger"
                                                                        >
                                                                            Validate
                                                                        </Button>
                                                                    </Grid>
                                                                )
                                                            }

                                                            <ValidationModal
                                                                isShowing={isShowingValidation}
                                                                data={validationDetails}
                                                                hide={toggleValidation(false, {})}
                                                                isValidating={is_validating}
                                                            />
                                                            {
                                                                trigger_arr.length > key + 1 && (
                                                                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>
                                                                )
                                                            }
                                                        </Fragment>
                                                    );
                                                })
                                            ) : (
                                                <Fragment >
                                                    <Grid item xs={12} align="center">
                                                        <Typography variant="body1" color="textSecondary">No new triggers</Typography>
                                                    </Grid>
                                                </Fragment>
                                            )
                                        }
                                    </Grid>
                                </div>
                            )}
                        
                    </Grid>
                        

                    {
                        typeof unresolved_moms_list !== "undefined" && unresolved_moms_list.length > 0 && (
                            <Fragment>
                                <Grid item xs={12} container spacing={1}>
                                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>
                                    
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textPrimary">UNRESOLVED MOMS LIST</Typography>
                                    </Grid>
                        
                                    <Grid item xs={12} container spacing={2} alignItems="center">
                                        {
                                            unresolved_moms_list.map((row, key) => {
                                                const { moms_instance, observance_ts, op_trigger } = row;
                                                const { feature: { feature_type }, feature_name } = moms_instance;
                                                const feature = `${capitalizeFirstLetter(feature_type)} ${feature_name.toUpperCase()}`;
                                                const formatted_ts = format_ts(observance_ts);

                                                return (
                                                    <Fragment key={row.moms_id}>
                                                        <Grid item xs align="center">
                                                            <Typography variant="body1" color="textSecondary">Feature</Typography>
                                                            <Typography variant="body1" color="textPrimary">{feature}</Typography>
                                                        </Grid>

                                                        <Grid item xs={4} align="center">
                                                            <Typography variant="body1" color="textSecondary">Last Report</Typography>
                                                            <Typography variant="body1" color="textPrimary">{formatted_ts}</Typography>
                                                        </Grid>

                                                        <Grid item xs align="center">
                                                            <Typography variant="body1" color="textSecondary">Alert Level</Typography>
                                                            <Typography variant="body1" color="textPrimary">{op_trigger}</Typography>
                                                        </Grid>

                                                        {
                                                            unresolved_moms_list.length > key + 1 && (
                                                                <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>
                                                            )
                                                        }
                                                    </Fragment>
                                                );
                                            })
                                        }
                                    </Grid>
                                </Grid>
                            </Fragment>
                        )
                    }
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    color="secondary" size="small"
                    aria-label="Release candidate alert"
                    startIcon={<Publish />}
                    onClick={releaseFormOpenHandler(alertData, general_status)}
                    disabled={!is_release_time}
                >
                    Release
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function LatestSiteAlertsExpansionPanel (props) {
    const { 
        siteAlert, classes, expanded,
        handleExpansion, smsHandler,
        bulletinHandler, keyName, type,
        history
    } = props;
    const {
        event, internal_alert_level, releases,
        day, sent_statuses, public_alert_symbol
    } = siteAlert;
    const { alert_level } = public_alert_symbol;

    const { is_sms_sent, is_bulletin_sent } = sent_statuses;

    const { validity, site, event_start, event_id } = event;
    const { site_code, site_id } = site;
    const site_name = site_code.toUpperCase();
    
    const start_ts = format_ts(event_start);
    const validity_ts = format_ts(validity);

    const { release_id, data_ts, release_time } = releases[0];

    const is_onset = releases.length === 1;
    let adjusted_data_ts = data_ts;
    if (!is_onset) adjusted_data_ts = moment(data_ts).add(30, "minutes");
    adjusted_data_ts = format_ts(adjusted_data_ts);

    const panel_headers = [site_name, internal_alert_level];
    if (type === "extended") {
        panel_headers.push(`Day ${day}`);
    } else {
        panel_headers.push(adjusted_data_ts, release_time);
    }

    return (
        <ExpansionPanel
            expanded={expanded === keyName}
            onChange={handleExpansion(keyName)}
        >
            <ExpansionPanelSummary
                // expandIcon={<ExpandMoreIcon />}
                aria-controls={`${keyName}bh-content`}
                id={`${keyName}bh-header`}
                classes={{
                    content: classes.expansionPanelSummaryContent,
                    root: classes[`alert${alert_level}`]
                }}
            >
                {
                    panel_headers.map((elem, i) => (
                        <Typography
                            key={`exp-columns-${i + 1}`}
                            color="textSecondary"
                            variant="body2"
                        >
                            {elem}
                        </Typography>
                    ))
                }
            </ExpansionPanelSummary>
            <Divider style={{ marginBottom: 12 }} />
            <ExpansionPanelDetails>
                <Grid container spacing={1}>
                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Event Start:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{start_ts}</Typography>
                        </Grid>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Event Validity:</Typography>
                            <Typography component="span" variant="body1" color="textPrimary">{validity_ts}</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textPrimary">LATEST RELEASE</Typography>
                    </Grid>
                        
                    <Grid item xs={12} container spacing={1}>
                        {
                            [
                                ["Internal Alert", internal_alert_level],
                                ["Data Timestamp", format_ts(data_ts)],
                                ["Release Time", release_time]
                            ].map((row, key) => (
                                <Grid key={row[0]} item xs align="center">
                                    <Typography variant="body1" color="textSecondary">{row[0]}</Typography>
                                    <Typography variant="body1" color="textPrimary">{row[1]}</Typography>
                                </Grid>
                            ))
                        }
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    size="small" color="primary" 
                    startIcon={<Timeline />}
                    onClick={() => (history.push(`/monitoring/events/${event_id}`))}
                    align="left"
                >
                    Timeline
                </Button>
                <Button
                    size="small" color="primary" 
                    startIcon={<PhoneAndroid />}
                    onClick={smsHandler({
                        release_id, site_code, site_id,
                        type, public_alert_symbol
                    })}
                    endIcon={ is_sms_sent && <Done /> }
                >
                    EWI SMS
                </Button>
                <Button 
                    size="small" color="primary"
                    startIcon={<Description />}
                    onClick={bulletinHandler({ release_id, site_code, site_id, type, is_bulletin_sent })}
                    endIcon={ is_bulletin_sent && <Done /> }
                >
                    Bulletin
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function RoutineExpansionPanel (props) {
    const { 
        siteAlert, classes, expanded,
        handleExpansion, smsHandler,
        keyName
    } = props;
    const { released_sites } = siteAlert;

    let adjusted_data_ts = released_sites[0].data_ts;
    adjusted_data_ts = format_ts(adjusted_data_ts);

    return (
        <ExpansionPanel
            expanded={expanded === keyName}
            onChange={handleExpansion(keyName)}
        >
            <ExpansionPanelSummary
            // expandIcon={<ExpandMoreIcon />}
                aria-controls={`${keyName}bh-content`}
                id={`${keyName}bh-header`}
                classes={{
                    content: classes.expansionPanelSummaryContent,
                    root: classes.alert0
                }}
            >
                {
                    ["ROUTINE", adjusted_data_ts].map((elem, i) => (
                        <Typography
                            key={`exp-columns-${i + 1}`}
                            color="textSecondary"
                            variant="body2"
                        >
                            {elem}
                        </Typography>
                    ))
                }
            </ExpansionPanelSummary>
            <Divider style={{ marginBottom: 12 }} />
            <ExpansionPanelDetails>
                <Grid container spacing={1}>
                    <Grid item xs={12} container spacing={1}>
                        <Grid item xs={12} sm align="center">
                            <Typography component="span" variant="body1" color="textSecondary" style={{ paddingRight: 8 }}>Data Timestamp:</Typography>
                            {/* <Typography component="span" variant="body1" color="textPrimary">{adjusted_data_ts}</Typography> */}
                            <Typography component="span" variant="body1" color="textPrimary">{adjusted_data_ts}</Typography>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} style={{ margin: "6px 0" }}><Divider /></Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textPrimary">ROUTINE SITES</Typography>
                    </Grid>
                    
                    <Grid item xs={12} container spacing={1}>
                        {
                            released_sites.map((row, key) => (
                                <Grid key={`site-${row.site_code}`} item xs={2} align="center">
                                    <Typography variant="body1" color="textSecondary">{row.site_code.toUpperCase()}</Typography>
                                </Grid>
                            ))
                        }
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    size="small" color="primary" 
                    startIcon={<PhoneAndroid />}
                    onClick={smsHandler(released_sites)}
                    // endIcon={ is_sms_sent && <Done /> }
                >
                    EWI SMS
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function MonitoringTables (props) {
    const {
        candidateAlertsData, alertsFromDbData, width,
        releaseFormOpenHandler, history, generatedAlerts
    } = props;

    const classes = useStyles();
    const [expanded, setExpanded] = useState(false);
    // const { isShowing: isShowingValidation, toggle: toggleValidation } = useModal();
    const [isShowingValidation, setIsShowingValidation] = useState(false);
    const [validation_details, setValidationDetails] = useState({});
    const { isShowing: isShowingSendEWI, toggle: toggleSendEWI } = useModal();
    const { isShowing: isShowingSendRoutineEWI, toggle: toggleSendRoutineEWI } = useModal();
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);
    const { reporter_id_ct, setReporterIdCt, setCTFullName } = React.useContext(CTContext);
    const [routine_sites_list, setRoutineSitesList] = useState({});
    
    const handleExpansion = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const [ewi_message, setEWIMessage] = useState("");
    const smsHandler = release => elem_event => {
        setChosenReleaseDetail(release);

        const { release_id } = release;
        getEWIMessage(release_id, data => {
            setEWIMessage(data);
            toggleSendEWI();
        });
    };

    const routineSmsHandler = released_sites => () => {
        getRoutineEWIMessage({}, data => {
            setRoutineSitesList(released_sites);
            setEWIMessage(data);
            toggleSendRoutineEWI();
        });
    };

    const toggleValidation = (bool, data) => () => {
        setValidationDetails(data);
        setIsShowingValidation(bool);
    };

    const bulletinHandler = release => elem_event => {
        setChosenReleaseDetail(release);
        setIsOpenBulletinModal(true);
    };

    let latest_db_alerts = [];
    let extended_db_alerts = [];
    let overdue_db_alerts = [];
    let routine_db_alerts = [];
    if (alertsFromDbData !== null) {
        const { latest, extended, overdue, routine } = alertsFromDbData;
        latest_db_alerts = latest;
        extended_db_alerts = extended;
        overdue_db_alerts = overdue;
        routine_db_alerts = routine;
    }

    return (
        <div className={classes.root}>
            <Grid container className={classes.sectionHeadContainer}>
                <Grid item xs={12} align="right" style={{ marginBottom: 22 }}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="Monitoring Partner"
                        div_id="reporter_id_ct"
                        changeHandler={event => setReporterIdCt(event.target.value)}
                        value={reporter_id_ct}
                        css={classes.inputWidth}
                        returnFullNameCallback={ret => setCTFullName(ret)}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography className={classes.sectionHead} variant="h5">Candidate Alerts</Typography>
                </Grid>

                <Grid item xs={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        candidateAlertsData === null ? (
                            <MyLoader />
                        ) : (
                            candidateAlertsData.length !== 0 ? (
                                candidateAlertsData.map((row, index) => (
                                    <CandidateAlertsExpansionPanel
                                        key={`exp-${index + 1}`}
                                        classes={classes}
                                        alertData={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        releaseFormOpenHandler={releaseFormOpenHandler}
                                        index={index}
                                        isShowingValidation={isShowingValidation}
                                        toggleValidation={toggleValidation}
                                        validationDetails={validation_details}
                                        candidateAlertsData={candidateAlertsData}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No candidate alerts
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <Grid item xs={12}>
                    <Typography className={classes.sectionHead} variant="h5">Event Monitoring</Typography>
                </Grid>

                <Grid item xs={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            latest_db_alerts.length > 0 ? (
                                latest_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`latest-${index + 1}`}
                                        keyName={`latest-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        smsHandler={smsHandler}
                                        bulletinHandler={bulletinHandler}
                                        type="latest"
                                        history={history}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No active alerts on database
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <Grid item xs={12}>
                    <Typography className={classes.sectionHead} variant="h5">Extended Monitoring</Typography>
                </Grid>

                <Grid item xs={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            extended_db_alerts.length > 0 ? (
                                extended_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`db-alert-${index + 1}`}
                                        keyName={`db-alert-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        smsHandler={smsHandler}
                                        index={index}
                                        bulletinHandler={bulletinHandler}
                                        type="extended"
                                        history={history}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No sites under extended monitoring
                                </Typography>
                            )
                        )
                    }
                </Grid>

                {
                    // eslint-disable-next-line no-nested-ternary
                    alertsFromDbData === null ? (
                        <MyLoader />
                    ) : (
                        typeof routine_db_alerts.released_sites !== "undefined" && routine_db_alerts.released_sites.length > 0 && (
                            <Fragment>
                                <Grid item xs={12}>
                                    <Typography className={classes.sectionHead} variant="h5">Routine Monitoring</Typography>
                                </Grid>
                                <Grid item xs={12} style={{ marginBottom: 22 }}>
                                    <RoutineExpansionPanel
                                        key="routine-alert-panel"
                                        keyName="routine-alert-panel"
                                        classes={classes}
                                        siteAlert={routine_db_alerts}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        smsHandler={routineSmsHandler}
                                        index={0}
                                        bulletinHandler={bulletinHandler}
                                        type="routine"
                                        history={history}
                                    />
                                </Grid>
                            </Fragment>
                        )
                    )
                }

                <Grid item xs={12}>
                    <Typography className={classes.sectionHead} variant="h5">Overdue Event Monitoring</Typography>
                </Grid>

                <Grid item xs={12} style={{ marginBottom: 22 }}>
                    {
                        // eslint-disable-next-line no-nested-ternary
                        alertsFromDbData === null ? (
                            <MyLoader />
                        ) : (
                            overdue_db_alerts.length > 0 ? (
                                overdue_db_alerts.map((row, index) => (
                                    <LatestSiteAlertsExpansionPanel
                                        key={`overdue-alert-${index + 1}`}
                                        keyName={`overdue-alert-${index + 1}`}
                                        classes={classes}
                                        siteAlert={row}
                                        expanded={expanded}
                                        handleExpansion={handleExpansion}
                                        smsHandler={smsHandler}
                                        index={index}
                                        bulletinHandler={bulletinHandler}
                                        type="overdue"
                                        history={history}
                                    />
                                ))
                            ) : (
                                <Typography variant="body1" align="center">
                                    No sites under overdue alerts
                                </Typography>
                            )
                        )
                    }
                </Grid>

                <BulletinModal 
                    classes={classes}
                    isOpenBulletinModal={isOpenBulletinModal}
                    setIsOpenBulletinModal={setIsOpenBulletinModal}
                    releaseDetail={chosenReleaseDetail}
                />                
            </Grid>

            <SendEwiSmsModal
                modalStateHandler={toggleSendEWI} 
                modalState={isShowingSendEWI}
                textboxValue={ewi_message}
                releaseDetail={chosenReleaseDetail}
            />

            <SendRoutineEwiSmsModal
                modalStateHandler={toggleSendRoutineEWI} 
                modalState={isShowingSendRoutineEWI}
                textboxValue={ewi_message}
                siteList={routine_sites_list}
            />
        </div>
    );
}

export default MonitoringTables;