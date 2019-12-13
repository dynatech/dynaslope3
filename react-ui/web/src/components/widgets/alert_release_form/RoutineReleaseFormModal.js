import React, { useState, useEffect, useReducer } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Typography,
    Button, makeStyles, withMobileDialog,
} from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import RoutineReleaseForm from "./RoutineReleaseForm";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { getCurrentUser } from "../../sessions/auth";
import { CTContext } from "../../monitoring/dashboard/CTContext";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        marginTop: 8,
        marginBottom: 8
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    }
}));


function RoutineReleaseFormModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenCandidateAlert, setChosenCandidateAlert
    } = props;
    const classes = useStyles();
    const { user_id: reporter_id_mt } = getCurrentUser();
    const { reporter_id_ct } = React.useContext(CTContext);

    const [ewiPayload, setEwiPayload] = useState({});

    const initial_routine_data = {
        public_alert_symbol: "A0",
        public_alert_level: "0",
        data_timestamp: null,
        release_time: moment(),
        general_status: "routine",
        reporter_id_ct,
        reporter_id_mt,
        non_triggering_moms: []
    };
    const initial_routine_sites_list = [{
        checked_sites: [],
        given_sites: [],
        internal_alert_level: "A0",
        trigger_list_str: null
    },
    {
        checked_sites: [],
        given_sites: [],
        internal_alert_level: "ND",
        trigger_list_str: null
    }
    ];

    const [routineData, setRoutineData] = useState({ ...initial_routine_data });
    const [routineSitesList, setRoutineSitesList] = useState([ ...initial_routine_sites_list ]);

    // useEffect(() => {
    //     if (typeof chosenCandidateAlert !== "undefined" && chosenCandidateAlert !== null) {

    //         setEwiPayload({
    //             ewiPayload,

    //         })
    //     } else {
    //         setRoutineData({ ...initial_routine_data });
    //         setInternalAlertLevel("");
    //         setActiveStep(0);
    //     }
    // }, [chosenCandidateAlert, reporter_id_ct]);

    const handleSubmit = () => {
        console.log("Submitting data...", ewiPayload);
        // sendWSMessage("insert_ewi", ewiPayload);
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Alert Release Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Routine Release Form
                    </DialogContentText>
                    <RoutineReleaseForm
                        routineData={routineData}
                        setRoutineData={setRoutineData}
                        routineSitesList={routineSitesList}
                        setRoutineSitesList={setRoutineSitesList}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <div>
                            <Button onClick={closeHandler} color="primary">
                                Cancel
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleSubmit}>
                                Submit
                            </Button>
                        </div>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(RoutineReleaseFormModal);
