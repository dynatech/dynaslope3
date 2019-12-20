import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog,
} from "@material-ui/core";

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
        data_ts: null,
        release_time: moment(),
        general_status: "routine",
        reporter_id_ct,
        reporter_id_mt,
        non_triggering_moms: {}
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
    const [site_options, setSiteOptions] = useState([]);

    const disabled = (a0SiteList.site_id_list.length === 0 && NDSiteList.site_id_list.length === 0) || reporter_id_ct === "";

    useEffect(() => {
        setRoutineData({ ...initial_routine_data });
        const temp = prepareSitesOption(sites);
        setSiteOptions(temp);
        setA0SiteList({
            ...a0SiteList,
            site_id_list: temp
        });
    }, [sites]);

    useEffect(() => {
        if (typeof chosenCandidateAlert !== "undefined" && chosenCandidateAlert !== null && chosenCandidateAlert.general_status === "routine") {
            const copy = { ...chosenCandidateAlert };
            delete copy.routine_details;

            const temp = {
                ...initial_routine_data,
                ...copy
            };

            setRoutineData(temp);

            const { routine_details: rd } = chosenCandidateAlert;
            rd.forEach(row => {
                const { site_id_list, internal_alert_level } = row;

                const site_list = site_options.filter(s => site_id_list.includes(s.value));
                row.site_id_list = site_list;

                if (internal_alert_level === "A0") {
                    setA0SiteList(row);
                } else {
                    setNDSiteList(row);
                }
            });

            setEwiPayload({ ...ewiPayload });
        } else {
            setRoutineData({ ...initial_routine_data });
            const temp = prepareSitesOption(sites);
            setA0SiteList({
                ...a0SiteList,
                site_id_list: temp
            });
            setNDSiteList({
                ...NDSiteList,
                site_id_list: []
            });
        }
    }, [chosenCandidateAlert, reporter_id_ct, site_options]);

    const handleSubmit = () => {
        console.log("Submitting data...", ewiPayload);

        const f_data_ts = moment(routineData.data_ts).format("YYYY-MM-DD HH:mm:ss");
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
        sendWSMessage("insert_ewi", temp_payload);
        closeHandler();
    };

    const handleClose = () => {
        closeHandler();
        // setA0SiteList({ ...a0_list });
        // setNDSiteList({ ...nd_list });
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
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={disabled}
                            >
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
