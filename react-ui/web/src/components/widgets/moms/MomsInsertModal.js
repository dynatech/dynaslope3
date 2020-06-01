import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Typography,
    makeStyles, Grid, Box
} from "@material-ui/core";

import { useSnackbar } from "notistack";
import MomsForm from "./MomsForm";
import { reducerFunction, moms_entry } from "./state_handlers";
import { insertMomsToDB, getMOMsFeatures } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

import { capitalizeFirstLetter } from "../../../UtilityFunctions";

const useStyles = makeStyles(theme => ({
    form_message_style: {
        color: "red",
        fontStyle: "italic"
    }
}));

function momsFormValidation (moms_entries) {
    let has_duplicate_feature_name = false;
    let has_duplicate_obs_ts = false;
    let empty_fields = new Set();
    const feature_name_collection = [];
    const observance_ts_collection = [];
    let form_messsage = "";
    let button_state;
    moms_entries.forEach((row, index) => {
        const { moms } = row;
        let { 
            alert_level, feature_name, feature_type, narrative,
            observance_ts, remarks, reporter, validator, location
        } = moms;
        
        const moment_obs_ts = moment(observance_ts).format("YYYY-MM-DD HH:mm:00");

        if (feature_type !== null) {
            const { value: feature_type_value } = feature_type;
            if (feature_type_value === 9) {
                feature_name = "value";
            }
        }

        if (feature_name !== null) {
            const { value: feature_name_value } = feature_name;
            if (feature_name_collection.includes(feature_name_value)) {
                if (has_duplicate_feature_name === false) {
                    has_duplicate_feature_name = true;
                }
            } else {
                feature_name_collection.push(feature_name_value);
            }
            if (feature_name_value === 0) {
                if (location === undefined) {
                    location = "";
                }
            } else {
                location = "value";
            }
        }
        
        if (has_duplicate_feature_name === true || moment_obs_ts !== "Invalid date") {
            if (observance_ts_collection.includes(moment_obs_ts)) {
                if (has_duplicate_obs_ts === false) {
                    has_duplicate_obs_ts = true;
                }
            } else {
                observance_ts_collection.push(moment_obs_ts);
            }
        } 

        if (feature_type === null) {
            empty_fields.add("feature type");
        }

        if (feature_name === null) {
            empty_fields.add("feature name");
        }  

        if (location === "") {
            empty_fields.add("location");
        }

        if (alert_level === null) {
            empty_fields.add("alert level");
        }

        if (observance_ts === null) {
            empty_fields.add("observance timestamp");
        } 
        
        if (narrative === "") {
            empty_fields.add("narrative");
        }

        if (reporter === "") {
            empty_fields.add("reporter");
        }

        if (remarks === "") {
            empty_fields.add("remarks");
        }

        if (validator === "") {
            empty_fields.add("validator");
        }
        
    });

    empty_fields = [...empty_fields];

    if (has_duplicate_feature_name === false) has_duplicate_obs_ts = false;
    
    if (empty_fields.length !== 0 || has_duplicate_obs_ts === true) {
        button_state = true;
        form_messsage = `Please input ${empty_fields.join(", ")} form(s). `;
        if (has_duplicate_obs_ts) {
            form_messsage += `Duplicate observance time for the same feature instance.`;
        }
    } else {
        button_state = false;
    }

    return { button_state, form_messsage };
}

function MomsInsertModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, match
    } = props;
    const classes = useStyles();
    const [site, setSite] = useState(null);
    const [site_code, setSiteCode] = useState(null);
    const [moms_entries, setMomsEntries] = useReducer(reducerFunction, []);
    const [submit_button_state, setSubmitButtonState] = useState(false);
    const [moms_form_message, setMomsFormMessage] = useState("");

    useEffect(() => {
        if (typeof match !== "undefined") {
            const { params: { site_code: sc } } = match;
            setSiteCode(sc);
        } 
    }, [match]);
    
    useEffect(() => {
        if (site !== null) setSiteCode(site.data.site_code);
    }, [site]);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };
    
    const [moms_feature_types, setMomsFeatureTypes] = useState([]);
    useEffect(() => {
        if (site_code !== null) {
            getMOMsFeatures(site_code, data => {
                const feature_types = data.map(feat => {
                    const { feature_id, feature_type, instances, alerts } = feat;
                    const cap = capitalizeFirstLetter(feature_type);
                    return { value: feature_id, label: cap, instances, alerts }; 
                });

                setMomsFeatureTypes({ ...moms_feature_types, feature_type: feature_types });

                const moms_entry_copy = moms_entry;
                moms_entry_copy.options.feature_type = feature_types;

                const is = [moms_entry_copy];
                setMomsEntries({ action: "OVERWRITE", value: is });
            });
        }
    }, [site_code]);

    useEffect(() => {
        console.log(moms_entries);
        const { button_state, form_messsage } = momsFormValidation(moms_entries);
        setSubmitButtonState(button_state);
        setMomsFormMessage(form_messsage);
    }, [moms_entries]);

    const handleSubmit = () => {
        console.log("moms_entries", moms_entries);

        const moms_list = moms_entries.map(({ moms }, index) => {
            const {
                alert_level, feature_name, feature_type,
                narrative, observance_ts, remarks,
                reporter, validator, location
            } = moms;

            const moment_obs_ts = moment(observance_ts).format("YYYY-MM-DD HH:mm:ss");
            const current_user = getCurrentUser();
            const { label: f_type } = feature_type;

            let f_name = "None";
            let instance_id = null;
            if (f_type !== "None") {
                const { value: val, label } = feature_name;
                f_name = label === "(Add new instance)" ? null : label;
                instance_id = val;
            }

            return 	{
                alert_level: alert_level.label,
                instance_id,
                feature_name: f_name,
                feature_type: f_type,
                report_narrative: narrative,
                observance_ts: moment_obs_ts,
                remarks,
                reporter_id: reporter,
                validator_id: validator,
                location,
                iomp: current_user.user_id
            };
        });

        const payload = {
            moms_list,
            site_code
        };

        console.log("PAYLOAD", payload);

        // Write data to DB
        // sendWSMessage("write_monitoring_moms_to_db", payload);
        closeHandler();
        insertMomsToDB(payload, response => {
            if (response.status) {
                sendWSMessage("run_alert_generation", { site_code });

                enqueueSnackbar(
                    "MOMs input success!",
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            } else {
                enqueueSnackbar(
                    response.message,
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        }, () => {
            enqueueSnackbar(
                "Error MOMS input...",
                {
                    variant: "error",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        });
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                maxWidth="sm"
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Insert Manifestation of Movement Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Provide manifestation of movement (MOMs) details to save information in our database.
                    </DialogContentText>

                    <MomsForm
                        momsEntries={moms_entries}
                        setMomsEntries={setMomsEntries}
                        siteCode={site_code}
                        site={site}
                        setSite={setSite}
                        selectSite
                    />
                </DialogContent>
                <DialogActions>
                    <Grid container spacing={0}>
                        <Grid item xs={12} sm={8}>
                            <Typography
                                variant="caption"
                                display="block"
                                className={classes.form_message_style}
                                gutterBottom
                                align="left">
                                {moms_form_message}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button onClick={closeHandler} color="primary" >
                                Cancel
                            </Button>
                            {/* <Button onClick={sample_fn} color="primary"> */}
                            <Button 
                                onClick={handleSubmit}
                                color="primary"
                                disabled={submit_button_state}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(MomsInsertModal);
