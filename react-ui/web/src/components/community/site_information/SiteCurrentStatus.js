import React, { useState, useEffect, Fragment } from "react";
import {
    Grid, Paper, Typography, Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import GeneralStyles from "../../../GeneralStyles";

import { getSiteSummary } from "../ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";

const useStyle = makeStyles(theme => {
    const general_styles = GeneralStyles(theme);
    return {
        ...general_styles,
        customPaper: {
            padding: 8,
            marginTop: 10,
            textAlign: "center"
        }
    };
});

function SiteCurrentStatus (props) {
    const classes = useStyle();
    const {
        siteId
    } = props;
    const [summary, setSummary] = useState("");
    const [mt_fullname, setMtFullname] = useState("");
    const [ct_fullname, setCtFullname] = useState("");
    const [e_type, setEType] = useState("");
    // const [has_released, setHasReleased] = useState("");

    useEffect(() => {
        getSiteSummary(siteId, ret => {
            setSummary(ret);
            const {
                mt_publisher, ct_publisher, has_release, event_type
            } = ret;
            // setHasReleased(has_release);
            const temp = capitalizeFirstLetter(event_type);
            setEType(temp);
            if (has_release) {
                setMtFullname(`${mt_publisher.last_name}, ${mt_publisher.first_name}`);
                setCtFullname(`${ct_publisher.last_name}, ${ct_publisher.first_name}`);
            }
        });
    }, []);


    return (
        <Paper className={classes.customPaper}>
            <Typography variant="h6" color="primary">Current Status</Typography>
            <Divider className={classes.Divider} />

            <Grid container spacing={1} justify="space-evenly" style={{ paddingTop: 5 }}>
                <Grid item xs={12}>
                    <Typography variant="h4" color="secondary">
                        {summary.internal_alert}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Event Type
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {e_type}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="textSecondary">
                        Event Start
                    </Typography>
                    <Typography variant="body1" color="textPrimary">
                        {summary.event_start}
                    </Typography>
                </Grid>

                {
                    summary.validity !== "None" && (
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="textSecondary">
                                Validity
                            </Typography>
                            <Typography variant="body1" color="textPrimary">
                                {summary.validity}
                            </Typography>
                        </Grid>
                    )
                }
                <Grid item xs={12} container spacing={1}>
                    <Grid item xs={12}>
                        <Typography variant="body1" color="textSecondary">
                            Latest Release
                        </Typography>
                    </Grid>

                    {
                        summary.has_released ? (                            
                            <Fragment>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Data TS
                                    </Typography>
                                    <Typography variant="body2" color="textPrimary">
                                        {summary.data_ts} 
                                    </Typography>
                                </Grid>
            
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Release Time
                                    </Typography>
                                    <Typography variant="body2" color="textPrimary">
                                        {summary.release_time}
                                    </Typography>
                                </Grid>
            
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        MT
                                    </Typography>
                                    <Typography variant="body2" color="textPrimary">
                                        {mt_fullname}
                                    </Typography>
                                </Grid>
            
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        CT
                                    </Typography>
                                    <Typography variant="body2" color="textPrimary">
                                        {ct_fullname}
                                    </Typography>
                                </Grid>
                            </Fragment>
                        ) : (
                            <Grid item xs={12}>
                                <Typography variant="body1" color="secondary">Have not released yet</Typography>
                            </Grid>
                        )
                    }
                </Grid>


            </Grid>
        </Paper>
    );
}

export default (SiteCurrentStatus);