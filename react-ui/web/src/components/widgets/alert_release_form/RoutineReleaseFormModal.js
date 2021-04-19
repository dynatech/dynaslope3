import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog,
} from "@material-ui/core";

import { useSnackbar } from "notistack";
import RoutineReleaseForm from "./RoutineReleaseForm";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { getCurrentUser } from "../../sessions/auth";
import { GeneralContext } from "../../contexts/GeneralContext";
import { getUnreleasedRoutineSites } from "./ajax";


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
    
    return temp.sort((a, b) => a.site_id > b.site_id);
}


function RoutineReleaseFormModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, chosenCandidateAlert,
        setChosenCandidateAlert
    } = props;
    const { user_id: reporter_id_mt } = getCurrentUser();
    const { sites } = useContext(GeneralContext);

    const [ewiPayload, setEwiPayload] = useState({});
    const { enqueueSnackbar } = useSnackbar();

    const initial_routine_data = {
        public_alert_symbol: "A0",
        public_alert_level: 0,
        data_ts: null,
        release_time: moment(),
        general_status: "routine",
        reporter_id_ct: "",
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
    const [dataTimestamp, setDataTimestamp] = useState(null);

    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setDisabled((a0SiteList.site_id_list.length === 0 && NDSiteList.site_id_list.length === 0) || routineData.reporter_id_ct === "");
    }, [a0SiteList.site_id_list, NDSiteList.site_id_list, routineData.reporter_id_ct]);

    useEffect(() => {
        setRoutineData({ ...initial_routine_data });
        const temp = prepareSitesOption(sites);
        setSiteOptions(temp);
    }, [sites]);

    useEffect(() => {
        if (chosenCandidateAlert === null) {
            if (dataTimestamp !== null) {
                getUnreleasedRoutineSites(dataTimestamp, data => {
                    const { unreleased_sites } = data;
                    const temp = prepareSitesOption(unreleased_sites);
                    setA0SiteList({
                        ...a0SiteList,
                        site_id_list: temp
                    });
                });
            } else {
                setA0SiteList({
                    ...a0SiteList,
                    site_id_list: []
                });
                setNDSiteList({
                    ...NDSiteList,
                    site_id_list: []
                });
            }
        }
    }, [dataTimestamp, chosenCandidateAlert]);

    useEffect(() => {
        if (typeof chosenCandidateAlert !== "undefined" && chosenCandidateAlert !== null && chosenCandidateAlert.general_status === "routine") {
            const copy = { ...chosenCandidateAlert };
            delete copy.routine_details;

            const temp = {
                ...initial_routine_data,
                ...copy
            };

            setRoutineData(temp);
            setDataTimestamp(copy.data_ts);

            const { routine_details: rd } = { ...chosenCandidateAlert };
            rd.forEach(row => {
                const { site_id_list, internal_alert_level } = row;
                const site_list = site_options.filter(s => site_id_list.includes(s.value));

                const a_temp = {
                    ...row,
                    site_id_list: site_list
                };

                if (internal_alert_level === "A0") {
                    setA0SiteList(a_temp);
                } else {
                    setNDSiteList(a_temp);
                }
            });

            setEwiPayload({ ...ewiPayload });
        }
    }, [chosenCandidateAlert, site_options]);

    const handleSubmit = () => {
        const f_data_ts = moment(routineData.data_ts).format("YYYY-MM-DD HH:mm:00");
        const f_rel_time = moment(routineData.release_time).format("HH:mm:ss");
        const snackbar_key = enqueueSnackbar(
            "Inserting Routine EWI release...",
            {
                variant: "warning",
                persist: true
            }
        );

        const temp_payload = {
            ...routineData,
            data_timestamp: f_data_ts,
            release_time: f_rel_time,
            routine_details: [
                { ...a0SiteList },
                { ...NDSiteList }
            ],
            snackbar_key
        };
        
        console.log("Submitting data...", temp_payload);
        sendWSMessage("insert_ewi", temp_payload);
        closeHandler();
    };

    const handleClose = () => {
        closeHandler();
        setChosenCandidateAlert(null);
        setDataTimestamp(null);
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">Routine Release Form</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Transfer site codes to their respective list if needed. Put sites with ground data on A0 Sites list
                    while put sites without ground data on ND Sites. 
                </DialogContentText>
                    
                <RoutineReleaseForm
                    routineData={routineData}
                    setRoutineData={setRoutineData}
                    a0SiteList={a0SiteList}
                    setA0SiteList={setA0SiteList}
                    NDSiteList={NDSiteList}
                    setNDSiteList={setNDSiteList}
                    dataTimestamp={dataTimestamp}
                    setDataTimestamp={setDataTimestamp}
                />
            </DialogContent>
            <DialogActions>
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
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(RoutineReleaseFormModal);
