import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog
} from "@material-ui/core";
// import AlertReleaseForm from "./AlertReleaseForm";
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
        chosenNarrative, isUpdateNeeded, isEditMode,
        isFromSiteLogs
    } = props;

    const current_user = getCurrentUser();

    const initial_data = {
        narrative_id: null,
        // site_list: [],
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

    useEffect(() => {
        let default_narr_data = {};

        if (Object.keys(chosenNarrative).length !== 0) {
            const {
                id, narrative, timestamp, site_id, user_id, event_id, type_id
            } = chosenNarrative;

            const site = site_options.filter(row => row.value === site_id);
            delete site.data;
            setSiteList([...site]);

            default_narr_data = {
                narrative_id: id,
                // site_list: [site_id],
                timestamp, narrative,
                user_id, event_id, type_id
            };
            setNarrativeData(default_narr_data);
        }
    }, [chosenNarrative]);
    useEffect( () => {
        const args = narrative_data.narrative !== "" && narrative_data.site_list !== null;
        args ? setIsDisabled(false) : setIsDisabled(true);
    }, [narrative_data]);

    const handleSubmit = () => {
        
        const temp = [];
        site_list.forEach(({ value }) => {
            // Value is site_id
            temp.push(value);
        });
        narrative_data.site_list = temp;
        narrative_data.timestamp = moment(narrative_data.timestamp).format("YYYY-MM-DD HH:mm:ss");
        narrative_data.user_id = current_user.user_id;
        handleNarratives(narrative_data, ret => {
            console.log("ret", ret);
           
            handleReset();
            setIsUpdateNeeded(!isUpdateNeeded);
            if (isEditMode) {
                closeFn();        
            }
        });
    };

    const handleReset = () => {
        setNarrativeData({
            narrative_id: null,
            // timestamp: moment().format("YYYY-MM-DD HH:mm"),
            narrative: "",
            user_id: current_user.user_id,
            event_id: "",
            type_id: 1
        });
        setSiteList(site_list);
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
                    />
                </DialogContent>
                <DialogActions>
                    <div>
                        <Button onClick={closeFn} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleFullReset} >Reset</Button>
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isDisabled}>
                            {isEditMode ? "Save Edits" : "Save & Add More"}
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        </div>
    );
}
export default withMobileDialog()(NarrativeFormModal);
