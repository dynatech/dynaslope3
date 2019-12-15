import React, { useState, Fragment, useContext } from "react";
import moment from "moment";
import ContentLoader from "react-content-loader";
import {
    Card, CardContent, Typography,
    Grid, CardActionArea,
    Button, Dialog, DialogContent,
    DialogTitle, DialogActions, Divider
} from "@material-ui/core";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";

function searchSites (site_code, sites) {
    let site_details = null;
    for (let index = 0; index < sites.length; index += 1) {
        if (sites[index].site_code === site_code) {
            site_details = sites[index];
            break;
        }
    }
    return site_details;
}

function formatTS (ts) {
    return moment(ts).format("D MMMM YYYY, h:mm");
}

// eslint-disable-next-line max-params
function getAlertDialog (chosen_site, open, handleClose, sites) {
    const {
        site_code, ts, internal_alert, validity, 
        current_trigger_alerts, event_triggers
    } = chosen_site;

    const site_details = searchSites(site_code, sites);
    const timestamp = formatTS(ts);
    const address = prepareSiteAddress(site_details);
    const rel_trigger_divs = [];
    let rel_subsurface = null;

    current_trigger_alerts.forEach((trigger) => {
        const { type, details } = trigger;

        if (type === "subsurface") {
            rel_subsurface = details;
        } else {
            const { alert_level, alert_symbol } = details;

            rel_trigger_divs.push(
                <Grid item xs={12} sm={4} key={type}>
                    <Typography variant="body1" color="textSecondary">{type.charAt(0).toUpperCase() + type.slice(1)} Alert</Typography>
                    <Typography variant="body1" color="textPrimary">
                        {alert_symbol}
                    </Typography>
                    {
                        type === "rainfall" && alert_level !== -1
                            ? (
                                <Typography variant="caption" color="textPrimary">
                                    {details.rain_gauge}
                                </Typography>
                            )
                            : (
                                <Fragment />
                            )
                    }
                </Grid>
            );
        }
    });

    return (
        <div>
            <Dialog
                fullWidth
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <div>{address}</div>
                    <Typography variant="overline">
                        {timestamp}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={1}>
                        <Grid item sm={6}>
                            <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {internal_alert}
                            </Typography>
                        </Grid>
                        <Grid item sm={6}>
                            {
                                validity !== "" && <Typography variant="body1" color="textSecondary">Validity</Typography>
                            }
                            <Typography variant="body1" color="textPrimary">
                                {validity}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12}>
                            <Typography variant="caption" color="textPrimary"><strong>OPERATIONAL ALERT STATUS</strong></Typography>
                        </Grid>

                        {
                            rel_trigger_divs.map(div => div)
                        }

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textPrimary">Subsurface Column Status</Typography>
                        </Grid>

                        {/* SUBSURFACE REL TRIGGER GOES HERE */}
                        {
                            rel_subsurface.length > 0
                                ? rel_subsurface.map((trigger) => {
                                    const { alert_symbol, tsm_name } = trigger;
                                    return (
                                        <Grid item xs={12} sm={4} key={tsm_name}>
                                            <Typography variant="body1" color="textSecondary">{tsm_name.toUpperCase()}</Typography>
                                            <Typography variant="body1" color="textPrimary">{alert_symbol}</Typography>
                                        </Grid>
                                    );
                                })
                                : <Grid item xs={12}>
                                    <Typography variant="body1" color="textSecondary">No subsurface sensors available</Typography>
                                </Grid>
                        }

                        {
                            event_triggers.length > 0 && (
                                <Fragment>
                                    <Grid item xs={12}><Divider /></Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="textPrimary"><strong>EVENT TRIGGERS</strong></Typography>
                                    </Grid>
                                </Fragment>
                            )
                        }

                        {
                            event_triggers.map(trigger => {
                                const { ts_updated, alert, tech_info, invalid, invalid_details } = trigger;
                                const formatted_ts = formatTS(ts_updated);

                                return (
                                    <Grid item xs={12} container spacing={1} key={alert}>
                                        <Grid item xs align="center">
                                            <Typography variant="body1" color="textPrimary"><strong>Trigger | {alert}</strong></Typography>
                                        </Grid>
                                        <Grid item xs align="center">
                                            <Typography variant="body1" color="textPrimary">{formatted_ts}</Typography>
                                        </Grid>
                                        <Grid item xs={12} align="center">
                                            <Typography variant="body2" color="textSecondary">{tech_info}</Typography>
                                        </Grid>

                                        {
                                            typeof invalid !== "undefined" && invalid === true && (
                                                <Fragment>
                                                    <Grid item xs={12} align="center">
                                                        <Typography variant="body1" color="textPrimary"><strong>INVALIDATED ALERT</strong></Typography>
                                                    </Grid>
                                                    <Grid item xs align="center">
                                                        <Typography variant="body1" color="textPrimary">
                                                            { `${invalid_details.user.first_name} ${invalid_details.user.last_name}`}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs align="center">
                                                        <Typography variant="body1" color="textPrimary">
                                                            {formatTS(invalid_details.ts_ack)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} align="center">
                                                        <Typography variant="body2" color="textSecondary">{invalid_details.remarks}</Typography>
                                                    </Grid>
                                                </Fragment>
                                            )
                                        }
                                        <Grid item xs={12}><Divider /></Grid>
                                    </Grid>
                                );
                            })
                        }
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

// eslint-disable-next-line max-params
function createCard (alert_detail, index, handleClickOpen, handleClickClose) {
    const { ts, site_code, internal_alert } = alert_detail;
    const timestamp = formatTS(ts);

    return (
        <Grid item xs={6} sm={4} lg={3} key={index}>
            <Card className="alert-card">
                <CardActionArea onClick={handleClickOpen(index)}>
                    <CardContent style={{ paddingBottom: 16 }}>
                        <Typography className="card-title" color="textSecondary" gutterBottom>
                            {timestamp}
                        </Typography>
                        <div style={{ display: "flex", alignItems: "baseline", alignContent: "flex-end", justifyContent: "space-between" }}>
                            <Typography variant="h5" component="h2">
                                {site_code.toUpperCase()}
                            </Typography>
                            <Typography className="card-internal-alert" color="textSecondary">
                                {internal_alert}
                            </Typography>
                        </div>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

const MyLoader = () => (
    <ContentLoader 
        height={300}
        width={684}
        speed={1}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="8" y="1" rx="0" ry="0" width="206" height="116" /> 
        <rect x="238" y="1" rx="0" ry="0" width="206" height="116" /> 
        <rect x="469" y="0" rx="0" ry="0" width="206" height="116" /> 
        <rect x="8" y="140" rx="0" ry="0" width="206" height="116" /> 
        <rect x="238" y="140" rx="0" ry="0" width="206" height="116" /> 
        <rect x="469" y="140" rx="0" ry="0" width="206" height="116" />
    </ContentLoader>
);
  

function GeneratedAlerts (props) {
    const [open, setOpen] = useState(false);
    const [key, setKey] = useState(0);

    const handleClickOpen = i => event => {
        setOpen(true);
        setKey(i);
    };
    const handleClose = () => {
        setOpen(false);
    };

    let dialog = "";
    const { generatedAlertsData } = props;
    const { sites } = useContext(GeneralContext);

    if (generatedAlertsData !== null) {
        if (generatedAlertsData.length > 0) {
            const chosen_site = generatedAlertsData[key];
            dialog = getAlertDialog(chosen_site, open, handleClose, sites);
        }
    }

    return (
        <Fragment>
            <Grid container spacing={2}>
                {
                    generatedAlertsData === null ? (
                        <MyLoader />
                    ) : (
                        generatedAlertsData.map((alert_detail, index) => (
                            createCard(alert_detail, index, handleClickOpen, handleClose)
                        ))
                    )
                   
                }
                {dialog}
            </Grid>
        </Fragment>
    );
}

export default GeneratedAlerts;