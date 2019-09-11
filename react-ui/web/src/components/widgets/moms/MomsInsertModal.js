import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import MomsForm from "./MomsForm";
import getMOMsFeatures from "./ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";


const moms_entry = {
    moms: {
        feature_type: null,
        feature_name: null,
        alert_level: null,
        observance_ts: null,
        narrative: "",
        reporter: null,
        remarks: "",
        validator: null
    }, 
    options: {
        feature_type: [],
        feature_name: {
            options: [],
            disabled: true
        },
        alert_level: {
            options: [],
            disabled: true
        }
    }
};

function reducerFunction (state, payload) {
    const { action, key, attribute, value } = payload;
    const new_state = JSON.parse(JSON.stringify(state));

    switch (action) {
        case "ADD_INSTANCE":
            return [
                ...state,
                JSON.parse(JSON.stringify(moms_entry))
            ];
        case "DELETE_INSTANCE":
            new_state.splice(key, 1);

            return [...new_state];
        case "UPDATE_DETAILS":
            new_state[key].moms[attribute] = value;

            if (attribute === "feature_type") {
                const { instances, alerts } = value;

                const instances_opt = instances.map(ins => {
                    const { instance_id, feature_name } = ins;
                    const cap = capitalizeFirstLetter(feature_name);
                    return { value: instance_id, label: cap }; 
                });

                const alerts_opt = alerts.map(al => {
                    const { feature_alert_id, alert_level, description } = al;
                    return { value, feature_alert_id, label: alert_level, description };
                });

                const { moms, options } = new_state[key];

                new_state[key].options = {
                    ...options,
                    feature_name: {
                        options: instances_opt,
                        disabled: false
                    },
                    alert_level: {
                        options: alerts_opt,
                        disabled: false
                    },
                };

                new_state[key].moms = {
                    ...moms,
                    feature_name: null,
                    alert_level: null
                };
            }

            return [...new_state];
        default:
            return state;
    }
}

function MomsInsertModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, width,
        match: { params: { site_code } }
    } = props;

    const [ form_options, updateFormOptions ] = useState({
        feature_type: [],
        feature_name: {
            options: [],
            disabled: true
        },
        alert_level: {
            options: [],
            disabled: true
        }
    });

    useEffect(() => {
        getMOMsFeatures(site_code, data => {
            const feature_types = data.map(feat => {
                const { feature_id, feature_type, instances, alerts } = feat;
                const cap = capitalizeFirstLetter(feature_type);
                return { value: feature_id, label: cap, instances, alerts }; 
            });

            updateFormOptions({ ...form_options, feature_type: feature_types });
        });
    }, []);

    const moms_entry_copy = moms_entry;
    moms_entry_copy.options.feature_type = form_options.feature_type;

    const initial_state = [moms_entry_copy];
    const [ moms_entries, setMomsEntries ] = useReducer(reducerFunction, initial_state);

    // useEffect(() => {
    //     console.log("HHUHUHUHU", moms_entries);
    // }, [moms_entries]);

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                maxWidth={width}
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
                        formOptions={form_options}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={closeHandler} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(MomsInsertModal);
