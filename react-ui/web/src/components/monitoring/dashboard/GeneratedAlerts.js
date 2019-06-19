import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import {
    Card, CardContent, Typography,
    Grid, CardActionArea,
    Button, Dialog, DialogContent,
    DialogTitle, DialogActions, Divider
} from "@material-ui/core";
import { elementType } from "prop-types";
// import GenAlertsData from "../../../temp/generated_alerts.json";
import { sites } from "../../../store";

let id = 0;
function createData (trigger_type, trigger_ts) {
    id += 1;
    return { id, trigger_type, trigger_ts };
}

function searchSites (site_code) {
    let site_details = null;
    for (let index = 0; index < sites.length; index += 1) {
        if (sites[index].site_code === site_code) {
            site_details = sites[index];
            break;
        }
    }
    return site_details;
}

function prepareSiteAddress (site_details) {
    const { purok, sitio, barangay, municipality, province, site_code } = site_details;
    let address = "";

    if (sitio !== null) address = `Sitio ${sitio}, `;
    if (purok !== null) address += `Purok ${purok}, `;

    address += `Brgy. ${barangay}, ${municipality}, ${province} (${site_code.toUpperCase()})`;

    return address;
}

function getAlertDialog (chosen_site, open, handleClose) {
    const { site_code, ts, internal_alert, validity, release_triggers, event_triggers } = chosen_site;
    const site_details = searchSites(site_code);
    const timestamp = moment(ts).format("D MMMM YYYY, h:mm");
    const address = prepareSiteAddress(site_details);
    const rel_trigger_divs = [];
    let rel_subsurface = null;

    release_triggers.forEach((trigger) => {
        const { type, details } = trigger;

        if (type === "subsurface") {
            rel_subsurface = details;
        } else {
            const { alert_level } = details;

            rel_trigger_divs.push(
                <Grid item xs={12} sm={4} key={type}>
                    <Typography variant="body1" color="textSecondary">{type.charAt(0).toUpperCase() + type.slice(1)} Alert</Typography>
                    <Typography variant="body1" color="textPrimary">
                        {alert_level}
                    </Typography>
                    {
                        type === "rainfall" && alert_level !== "nd"
                            ? (
                                <Typography variant="caption" color="textPrimary">
                                    {details.details.rain_gauge}
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
                    {/* Brgy. Gamut, Tago, Surigao Del Sur (GAM) */}
                    {address}
                    <Typography variant="overline">
                        {/* 10 April 2019, 16:30 */}
                        {timestamp}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={8}>
                        <Grid item sm={6}>
                            <Typography variant="body1" color="textSecondary">Internal Alert Level</Typography>
                            <Typography variant="body1" color="textPrimary">
                                {/* A3-sG0R */}
                                {internal_alert}
                            </Typography>
                        </Grid>
                        <Grid item sm={6}>
                            {
                                validity !== "" && <Typography variant="body1" color="textSecondary">Validity</Typography>
                            }
                            <Typography variant="body1" color="textPrimary">
                                {/* 12 April 2019, 20:00 */}
                                {validity}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" color="textPrimary">Operational Alert Status</Typography>
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
                                    const { alert_level, tsm_name } = trigger;
                                    return (
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="body1" color="textSecondary">{tsm_name.toUpperCase()}</Typography>
                                            <Typography variant="body1" color="textPrimary">{alert_level}</Typography>
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
                                        <Typography variant="subtitle1" color="textPrimary">Event Triggers</Typography>
                                    </Grid>
                                </Fragment>
                            )
                        }

                        {
                            event_triggers.map((trigger) => {
                                const { ts_updated, alert, tech_info } = trigger;
                                const formatted_ts = moment(ts_updated).format("D MMMM YYYY, h:mm");

                                return (
                                    <Grid item sm={12}>
                                        <Typography variant="body1" color="textPrimary">Trigger | {alert}</Typography>
                                        <Typography variant="body1" color="textPrimary">{formatted_ts}</Typography>
                                        <Typography variant="caption" color="textSecondary">{tech_info}</Typography>
                                    </Grid>
                                );
                            })
                        }
                    </Grid>

                    {/* <Divider />
                                
                                <Table style={{ minWidth: 400 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Trigger Type</TableCell>
                                            <TableCell align="right">Trigger Timestamp</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map(row => (
                                            <TableRow key={row.id}>
                                                <TableCell component="th" scope="row">
                                                    {row.trigger_type}
                                                </TableCell>
                                                <TableCell align="right">{row.trigger_ts}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table> */}

                    {/* <DialogContentText id="alert-dialog-description">
                                    Internal Alert: A1-R
                                </DialogContentText> */}
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

class GeneratedAlerts extends PureComponent {
    state = {
        open: false,
        key: 0,
        generated_alerts: []
    };

    handleClickOpen = i => event => {
        this.setState({ open: true, key: i });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    createCard = (alert_detail, index) => {
        const { ts, site_code, internal_alert } = alert_detail;
        const timestamp = moment(ts).format("D MMMM YYYY, h:mm");

        return (
            <Grid item xs={6} sm={3} lg={2} key={index}>
                <Card className="alert-card">
                    <CardActionArea onClick={this.handleClickOpen(index)}>
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

    createTriggerEntry = (type, details, index) => {

        let return_data = "";

        if (type === "rainfall") {
            const { alert_level } = details;

            return_data = (
                <Grid item sm={4} key={index}>
                    <Typography variant="body1" color="textSecondary">Rainfall Alert</Typography>
                    <Typography variant="body1" color="textPrimary">
                        {alert_level}
                    </Typography>
                </Grid>
            );
        } else if (type === "surficial") {
            const { alert_level } = details;

            return_data = (
                <Grid item xs={12} sm={4} key={index}>
                    <Typography variant="body1" color="textSecondary">Surficial Alert</Typography>
                    <Typography variant="body1" color="textPrimary">
                        {alert_level}
                    </Typography>
                </Grid>
            );
        } else if (type === "moms") {
            const { alert_level } = details;

            return_data = (
                <Grid item xs={12} sm={4} key={index}>
                    <Typography variant="body1" color="textSecondary">Moms Alert</Typography>
                    <Typography variant="body1" color="textPrimary">
                        {alert_level}
                    </Typography>
                </Grid>
            );
        }
        return return_data;
    }


    render () {
        const { open, key } = this.state;
        let dialog = "";
        const { generated_alerts_data } = this.props;


        if (generated_alerts_data.length > 0) {
            const chosen_site = generated_alerts_data[key];
            dialog = getAlertDialog(chosen_site, open, this.handleClose);
        }

        return (
            <Fragment>
                <Grid container spacing={2}>
                    {
                        generated_alerts_data.map((alert_detail, index) => this.createCard(alert_detail, index))
                    }
                    {dialog}
                    {/* {cards} */}
                </Grid>
            </Fragment>
        );
    }
}


export default GeneratedAlerts;