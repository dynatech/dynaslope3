import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import MomsForm from "./MomsForm";
import { reducerFunction } from "./state_handlers";
import MomsInitialState from "./MomsInitialState";
import { insertMomsToDB } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";
import { sendWSMessage } from "../../../websocket/monitoring_ws";

function MomsInsertModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, width,
        match: { params: { site_code } },
        snackbarHandler
    } = props;

    const initial_state = MomsInitialState(site_code);
    const [ moms_entries, setMomsEntries ] = useReducer(reducerFunction, initial_state);

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

            return 	{
                alert_level: alert_level.label,
                instance_id: feature_name.value,
                feature_name: feature_name.label,
                feature_type: feature_type.label,
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
        // closeHandler();
        insertMomsToDB(payload, ret => {
            console.log(ret);
            snackbarHandler();
            closeHandler();
        });
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                maxWidth="sm"
                // maxWidth={width}
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
                        site_code={site_code}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} color="primary">
                        Cancel
                    </Button>
                    {/* <Button onClick={sample_fn} color="primary"> */}
                    <Button onClick={handleSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(MomsInsertModal);
