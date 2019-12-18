import React, { Fragment, useState } from "react";
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
import { getEWIMessage } from "../ajax";
import SendEwiSmsModal from "./SendEwiSmsModal";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { CTContext } from "./CTContext";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";

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
        inputWidth: { width: "50%" }
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
        isShowingValidation, toggleValidation
    } = props;

    let site = "";
    let ts = "";
    let ia_level = "";
    let trigger_arr = [];
    let has_new_triggers = false;
    const {
        general_status, is_release_time,
        unresolved_moms_list
    } = alertData;
    
    if (general_status === "routine") {
        const { data_ts, public_alert_symbol } = alertData;
        site = "ROUTINE RELEASE";
        ts = format_ts(data_ts);
        ia_level = public_alert_symbol;
    } else {
        const { 
            site_code, release_details, internal_alert_level,
            trigger_list_arr
        } = alertData;
        const { data_ts } = release_details;
        site = site_code;
        ts = format_ts(data_ts);
        ia_level = internal_alert_level;
        trigger_arr = trigger_list_arr;
        has_new_triggers = trigger_arr !== "No new triggers" && trigger_arr.length > 0;
    }
    site = site.toUpperCase();
    const gen_status = general_status.toUpperCase();

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
                classes={{ content: classes.expansionPanelSummaryContent }}
            >
                {
                    [site, ia_level, ts, gen_status].map((elem, i) => (
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

                                        const as_details = {
                                            site, trigger_id, ts_updated
                                        };

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
                                                                onClick={toggleValidation}
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
                                                    data={as_details}
                                                    hide={toggleValidation}
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
                                    <Fragment>
                                        <Grid item xs={12} align="center">
                                            <Typography variant="body1" color="textSecondary">No new triggers</Typography>
                                        </Grid>
                                    </Fragment>
                                )
                            }
                        </Grid>
                    </Grid>

                    {
                        typeof unresolved_moms_list !== "undefined" && unresolved_moms_list.length > 0 && (
                            <Fragment>
                                <Grid item xs={12} container spacing={1}>
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
                                                            trigger_arr.length > key + 1 && (
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
        day, sent_statuses
    } = siteAlert;

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
                classes={{ content: classes.expansionPanelSummaryContent }}
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
                    onClick={smsHandler({ release_id, site_code, site_id, type })}
                    endIcon={ is_sms_sent && <Done /> }
                >
                    EWI SMS
                </Button>
                <Button 
                    size="small" color="primary"
                    startIcon={<Description />}
                    onClick={bulletinHandler({ release_id, site_code, site_id, type })}
                    endIcon={ is_bulletin_sent && <Done /> }
                >
                        Bulletin
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

function MonitoringTables (props) {
    const {
        candidateAlertsData, alertsFromDbData, width,
        releaseFormOpenHandler, history
    } = props;

    const classes = useStyles();
    const [expanded, setExpanded] = useState(false);
    const { isShowing: isShowingValidation, toggle: toggleValidation } = useModal();
    const { isShowing: isShowingSendEWI, toggle: toggleSendEWI } = useModal();
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);
    const { reporter_id_ct, setReporterIdCt, setCTFullName } = React.useContext(CTContext);
    
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

    const bulletinHandler = release => elem_event => {
        setChosenReleaseDetail(release);
        setIsOpenBulletinModal(true);
    };

    const is_desktop = isWidthUp("md", width);

    let latest_db_alerts = [];
    let extended_db_alerts = [];
    let overdue_db_alerts = [];
    if (alertsFromDbData !== null) {
        const { latest, extended, overdue } = alertsFromDbData;
        latest_db_alerts = latest;
        extended_db_alerts = extended;
        overdue_db_alerts = overdue;
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
                    <Typography className={classes.sectionHead} variant="h5">Latest Site Alerts</Typography>
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
                    <Typography className={classes.sectionHead} variant="h5">Sites under Extended Monitoring</Typography>
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

                <Grid item xs={12}>
                    <Typography className={classes.sectionHead} variant="h5">Sites with Due Alerts</Typography>
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
        </div>
    );
}

export default MonitoringTables;