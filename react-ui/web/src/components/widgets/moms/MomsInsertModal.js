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

function MomsInsertModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, width,
        match: { params: { site_code } }
    } = props;

    const initial_state = MomsInitialState(site_code);
    const [ moms_entries, setMomsEntries ] = useReducer(reducerFunction, initial_state);

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
