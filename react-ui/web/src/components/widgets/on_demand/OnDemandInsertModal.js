import React, { useState, useEffect, useReducer, useContext } from "react";
import moment from "moment";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Typography,
    makeStyles, Grid
} from "@material-ui/core";

import { useSnackbar } from "notistack";
import OnDemandForm from "./OnDemandForm";
// import { reducerFunction, moms_entry } from "./state_handlers";
import { insertOnDemandToDb } from "./ajax";
import { getCurrentUser } from "../../sessions/auth";
import { sendWSMessage } from "../../../websocket/monitoring_ws";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";

const useStyles = makeStyles(theme => ({
    form_message_style: {
        color: "red",
        fontStyle: "italic"
    }
}));

function OnDemandInsertModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, match
    } = props;
    const classes = useStyles();
    const { sites } = useContext(GeneralContext);

    const [site, setSite] = useState(null);
    const [site_code, setSiteCode] = useState(null);
    const [to_select_site, setToSelectSite] = useState(true);
    const [submit_button_state, setSubmitButtonState] = useState(false);
    const [tech_info, setTechInfo] = useState("");
    const [alert_level, setAlertLevel] = useState("1");
    const [request_ts, setRequestTs] = useState(null);
    const [reason, setReason] = useState("");
    const [reporter_id, setReporter] = useState("");

    useEffect(() => {
        if (typeof match !== "undefined") {
            const { params: { site_code: sc } } = match;
            setToSelectSite(false);
            setSiteCode(sc);
        } 
    }, [match]);
    
    useEffect(() => {
        const row = sites.find(x => x.site_code === site_code);
        if (row) setSite({ value: row.site_id, data: row });
    }, [sites, site_code]);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const clearFields = () => {
        setSite(null);
        setSiteCode(null);
        setToSelectSite(true);
        setSubmitButtonState(false);
        setTechInfo("");
        setAlertLevel("1");
        setRequestTs(null);
        setReason("");
        setReporter("");
    };

    useEffect(() => {
        let button_state = request_ts === null || reason === "" || reporter_id === "";
        if (alert_level === "1") {
            button_state = button_state || tech_info === "";
        }
        setSubmitButtonState(button_state);
    }, [request_ts, reason, reporter_id, tech_info, alert_level]);

    const handleSubmit = () => {

        closeHandler();
        const on_demand_data = {
            tech_info,
            alert_level,
            reason,
            reporter_id,
            request_ts: moment(request_ts).format("YYYY-MM-DD HH:mm:ss"),
            site_id: site.value
        }
        
        insertOnDemandToDb(on_demand_data, response => {
            const { status, message } = response;
            let variant = "success";
            if (status) {
                clearFields();
            } else {
                variant = "error";
            }

            enqueueSnackbar(
                message, 
                {
                    variant,
                    autoHideDuration: 4000,
                    action: snackBarActionFn
                }
            );
        });
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            maxWidth="sm"
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">Insert On Demand Form</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Provide on demand details to save information in our database.
                </DialogContentText>

                <OnDemandForm
                    site={site}
                    setSite={setSite}
                    selectSite={to_select_site}
                    alertLevel={alert_level}
                    setAlertLevel={setAlertLevel}
                    setRequestTs={setRequestTs}
                    setReason={setReason}
                    setReporter={setReporter}
                    setTechInfo={setTechInfo}
                    reason={reason}
                    requestTs={request_ts}
                    reporter={reporter_id}
                    tecchInfo={tech_info}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeHandler} color="primary">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    color="primary"
                    disabled={submit_button_state}>
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(OnDemandInsertModal);
