import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";

import { useSnackbar } from "notistack";

import { handleNarratives } from "./ajax";
import NarrativeForm from "./NarrativeForm";
import { getCurrentUser } from "../../sessions/auth";
import { GeneralContext } from "../../contexts/GeneralContext";
import { prepareSiteAddress } from "../../../UtilityFunctions";

export function prepareSitesOption (arr, to_include_address) {
    return arr.map(site => {
        const { 
            site_code, site_id
        } = site;

        let address = site_code.toUpperCase();
        if (to_include_address) address = prepareSiteAddress(site, true, "start");
        return { value: site_id, label: address, data: site };
    });
}

function NarrativeFormModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, setIsUpdateNeeded,
        chosenNarrative, isEditMode,
        isFromSiteLogs, setSort, resetInput
    } = props;

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const current_user = getCurrentUser();

    const initial_data = {
        narrative_id: null,
        timestamp: moment().format("YYYY-MM-DD HH:mm"),
        narrative: "",
        user_id: current_user.user_id,
        event_id: null,
        type_id: 1
    };

    const [site_list, setSiteList] = useState(null);
    const [narrative_data, setNarrativeData] = useState(initial_data);
    const [isDisabled, setIsDisabled] = useState(true);
    const { sites } = useContext(GeneralContext);
    const site_options = prepareSitesOption(sites, true);
    const call_ack_hashtag = "#EWIResponseCall"; // when changing this, mirror change on communication_task.py
    const [call_ack, setCallAck] = useState(false);
    const [to_use_current_instance, setToUseCurrentInstance] = useState(true);

    useEffect(() => {
        let default_narr_data = {};
        let temp_narrative = "";
        if (Object.keys(chosenNarrative).length !== 0) {
            const {
                id, narrative, timestamp, site_id, user_id, event_id, type_id
            } = chosenNarrative;

            const site = site_options.filter(row => row.value === site_id);
            delete site.data;
            site.event_id = event_id;
            setSiteList([...site]);

            default_narr_data = {
                narrative_id: id,
                timestamp, narrative,
                user_id, event_id, type_id
            };
            setNarrativeData(default_narr_data);
            temp_narrative = narrative;
        }
        setCallAck(temp_narrative.includes(call_ack_hashtag));
    }, [chosenNarrative]);
    
    useEffect(() => {
        const bool = narrative_data.narrative === "" || site_list === null;
        setIsDisabled(bool);
    }, [narrative_data, site_list]);

    const handleSubmit = () => {
        setIsDisabled(true);

        const snackbar = enqueueSnackbar(
            "Inserting site log...",
            {
                variant: "warning",
                persist: true
            }
        );

        const temp = site_list.map(x => {
            const { value, event_id } = x; // Value is site_id
            let temp_id = event_id || null;
            if (!to_use_current_instance) temp_id = null;
            
            return { site_id: value, event_id: temp_id };
        });

        narrative_data.site_list = temp;
        narrative_data.timestamp = moment(narrative_data.timestamp).format("YYYY-MM-DD HH:mm:ss");
        narrative_data.user_id = current_user.user_id;
        console.log(narrative_data);
        // return;
        handleNarratives(narrative_data, ret => {
            console.log("ret", ret);
            handleReset();

            closeSnackbar(snackbar);
            enqueueSnackbar(
                "Site log inserted successfully!",
                {
                    variant: "success",
                    autoHideDuration: 3000
                }
            );

            setSort({ order_by: "id", order: "desc" });
            resetInput();
            setIsUpdateNeeded(true);
            if (isEditMode) {
                closeFn();        
            }
        });
    };

    const handleReset = () => {
        setNarrativeData({
            narrative_id: null,
            narrative: "",
            user_id: current_user.user_id,
            event_id: "",
            type_id: 1
        });
        setSiteList(site_list);
        setCallAck(false);
        setToUseCurrentInstance(true);
    };

    const handleFullReset = () => {
        setNarrativeData({
            narrative_id: null,
            timestamp: moment().format("YYYY-MM-DD HH:mm"),
            narrative: "",
            user_id: current_user.user_id,
            event_id: "",
            type_id: 1
        });
        setSiteList(null);
        setToUseCurrentInstance(true);
    };

    const closeFn = () => {
        closeHandler(); 
        handleFullReset();
    };

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                aria-labelledby="form-dialog-title"

            >
                <DialogTitle id="form-dialog-title">Site Logs Form</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Note: Only monitoring-related narratives can be entered in this form. 
                        Please use other forms dedicated to its purposes.
                    </DialogContentText>

                    <NarrativeForm
                        narrativeData={narrative_data}
                        setNarrativeData={setNarrativeData}
                        siteList={site_list}
                        setSiteList={setSiteList}
                        isFromSiteLogs={isFromSiteLogs}
                        callAck={call_ack}
                        setCallAck={setCallAck}
                        callAckHashtag={call_ack_hashtag}
                        toUseCurrentInstance={to_use_current_instance}
                        setToUseCurrentInstance={setToUseCurrentInstance}
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <Button onClick={closeFn} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleFullReset}>Reset</Button>
                        <Button 
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isDisabled}
                        >
                            {isEditMode ? "Save Edits" : "Save & Add More"}
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}
export default withMobileDialog()(NarrativeFormModal);
