import React, { useState, useEffect, useContext, useReducer } from "react";
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
import { GeneralContext } from "../../contexts/GeneralContext";


function prepareSitesOption (arr) {
    let temp = [];
    if (arr.length > 0) {
        temp = arr.map(site => {
            const { 
                site_code, site_id
            } = site;
    
            const s_code = site_code.toUpperCase();
            return { state: true, value: site_id, label: s_code, is_disabled: false };
        });
    }
    return temp;
}


function RoutineReleaseFormModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenCandidateAlert
    } = props;
    const { user_id: reporter_id_mt } = getCurrentUser();
    const { reporter_id_ct } = React.useContext(CTContext);
    const { sites } = useContext(GeneralContext);

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

    const a0_list = {
        site_id_list: [],
        internal_alert_level: "A0",
        trigger_list_str: null
    };
    const nd_list = {
        site_id_list: [],
        internal_alert_level: "ND",
        trigger_list_str: null
    };

    const [routineData, setRoutineData] = useState({ ...initial_routine_data });
    const [a0SiteList, setA0SiteList] = useState({ ...a0_list });
    const [NDSiteList, setNDSiteList] = useState({ ...nd_list });

    useEffect(() => {
        setRoutineData({ ...initial_routine_data });
        const temp = prepareSitesOption(sites);
        setA0SiteList({
            ...a0SiteList,
            site_id_list: temp
        });
    }, [sites]);

    useEffect(() => {
        if (typeof chosenCandidateAlert !== "undefined" && chosenCandidateAlert !== null && chosenCandidateAlert.general_status === "routine") {
            setRoutineData(chosenCandidateAlert);
            const { routine_details: rd } = chosenCandidateAlert;
            setA0SiteList(rd.filter(row => row.internal_alert_level === "A0"));
            setNDSiteList(rd.filter(row => row.internal_alert_level === "ND"));
            setEwiPayload({ ...ewiPayload });
        } else {
            setRoutineData({ ...initial_routine_data });
            const temp = prepareSitesOption(sites);
            setA0SiteList({
                ...a0SiteList,
                site_id_list: temp
            });
        }
    }, [chosenCandidateAlert, reporter_id_ct]);

    const handleSubmit = () => {
        console.log("Submitting data...", ewiPayload);

        const f_data_ts = moment(routineData.data_timestamp).format("YYYY-MM-DD HH:mm:ss");
        const f_rel_time = moment(routineData.release_time).format("YYYY-MM-DD HH:mm:ss");

        const temp_payload = {
            ...routineData,
            data_timestamp: f_data_ts,
            release_time: f_rel_time,
            routine_details: [
                { ...a0SiteList },
                { ...NDSiteList }
            ]
        };
        console.log("temp_payload", temp_payload);

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
                <DialogTitle id="form-dialog-title">Routine Release Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Routine Release Form
                    </DialogContentText>
                    <RoutineReleaseForm
                        routineData={routineData}
                        setRoutineData={setRoutineData}
                        a0SiteList={a0SiteList}
                        setA0SiteList={setA0SiteList}
                        NDSiteList={NDSiteList}
                        setNDSiteList={setNDSiteList}
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
