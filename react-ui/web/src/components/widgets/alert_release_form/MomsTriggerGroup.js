import React, { Fragment } from "react";
import moment from "moment";
import {
    Grid, makeStyles, FormControl,
    FormLabel, Typography, TextField
} from "@material-ui/core";

import { capitalizeFirstLetter } from "../../../UtilityFunctions";

const useStyles = makeStyles(theme => ({
    groupGridContainer: {
        marginTop: 0,
        marginBottom: 6
    }
}));

function MomsTriggerGroup (props) {
    const {
        triggersState, setTriggerState
    } = props;
    const classes = useStyles();

    const { moms } = triggersState;
    const { switchState, triggers } = moms;

    const techInfoHandler = () => {
        // TO DO:
        // setTriggerState here
        console.log("change has been made");
    };

    return (
        <Fragment>
            <Grid item xs={12} className={switchState ? classes.groupGridContainer : ""}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" className={classes.formLabel}>
                        <span>Manifestation of Movement</span>
                    </FormLabel>
                </FormControl>
                <Grid container spacing={2}>
                    <Grid item xs={12} align="center">
                        <Typography variant="body1" color="textSecondary">
                            NOTE: If you want to add MOMs in the release, use MOMs Insert Form.
                        </Typography>
                    </Grid>
                    {
                        triggers.map(row => {
                            const { alert, timestamp, tech_info, moms_list } = row;
                            return (
                                <Fragment key={alert}>
                                    <Grid item xs={12} sm={3} align="center">
                                        <Typography variant="body1" component="span" color="textSecondary">Trigger: </Typography>
                                        <Typography variant="body1" component="span"><strong>
                                            {alert}
                                        </strong></Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={9} align="center">
                                        <Typography variant="body1" component="span" color="textSecondary">Trigger Timestamp: </Typography>
                                        <Typography variant="body1" component="span"><strong>
                                            {timestamp.format("YYYY/MM/DD HH:mm:00")}
                                        </strong></Typography>
                                    </Grid>

                                    {
                                        moms_list.map(ml => {
                                            const { moms_instance, observance_ts } = ml;
                                            const { feature: { feature_type }, feature_name, instance_id } = moms_instance;

                                            return (
                                                <Grid key={instance_id} item xs={12} container spacing={0} justify="space-around">
                                                    <Grid item xs={6} sm align="center">
                                                        <Typography variant="body2" color="textSecondary">Feature Type</Typography>
                                                        <Typography variant="body2"><strong>
                                                            {capitalizeFirstLetter(feature_type)}
                                                        </strong></Typography>
                                                    </Grid>
                                                    <Grid item xs={6} sm align="center">
                                                        <Typography variant="body2" color="textSecondary">Feature Name</Typography>
                                                        <Typography variant="body2"><strong>{feature_name}</strong></Typography>
                                                    </Grid>
                                                    <Grid item xs={12} sm align="center">
                                                        <Typography variant="body2" color="textSecondary">Observance Timestamp</Typography>
                                                        <Typography variant="body2"><strong>
                                                            {moment(observance_ts).format("YYYY/MM/DD HH:mm:00")}
                                                        </strong></Typography>
                                                    </Grid>
                                                </Grid>
                                            );
                                        })
                                    }

                                    <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                                        <TextField
                                            required
                                            label="Technical Info"
                                            multiline
                                            rowsMax="2"
                                            placeholder="Enter technical info for 'MOMs' trigger"
                                            value={tech_info}
                                            onChange={techInfoHandler}
                                            fullWidth
                                        />
                                    </Grid>
                                </Fragment>                            
                            );
                        })
                    }
                </Grid>
            </Grid>
        </Fragment>
    );
}

export default MomsTriggerGroup;
