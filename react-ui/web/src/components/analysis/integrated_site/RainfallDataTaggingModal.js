import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogActions, Button, DialogContentText,
    Grid, TextField, Typography
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import { cloneDeep } from "lodash";

import SelectInputForm from "../../reusables/SelectInputForm";
import { getCurrentUser } from "../../sessions/auth";
import { saveInvalidRainfallTag } from "../ajax";

function RainfallDataTaggingModal (props) {
    const {
        isOpen, closeModalFn, taggingData,
        onTagSuccess
    } = props;

    const current_user = getCurrentUser();

    let data = {
        ts_start: null,
        ts_end: null
    };
    if (taggingData !== null) {
        data = { ...taggingData };
    }

    const [observed_data, setObservedData] = useState("");
    const [remarks, setRemarks] = useState("");
    const [is_disabled, setIsDisabled] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        setIsDisabled(observed_data === "");
    }, [observed_data]);

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const handleClose = () => {
        closeModalFn();
    };

    const handleSubmit = () => {
        const copy = cloneDeep(taggingData);
        delete copy.chart;

        const final_data = {
            tagger_id: current_user.user_id,
            ...copy,
            observed_data: parseInt(observed_data, 10),
            remarks: remarks || null
        };

        console.log("Submitting invalid tag", final_data);
        saveInvalidRainfallTag(final_data, ret => {
            const { status, message } = ret;
            if (status === "success") {
                handleClose();
                onTagSuccess();
            }

            enqueueSnackbar(
                message,
                {
                    variant: status,
                    autoHideDuration: 3000,
                    action: snackBarActionFn
                }
            );
        });
    };

    return (
        <Dialog
            fullWidth
            open={isOpen}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">Tag invalid rainfall data</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill in the required fields then submit. Note: Do NOT tag again already tagged points.
                </DialogContentText>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Start Timestamp
                        </Typography>

                        <Typography variant="body1" align="center">
                            <strong>{ data.ts_start }</strong>
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" align="center">
                            End Timestamp
                        </Typography>

                        <Typography variant="body1" align="center">
                            <strong>{ data.ts_end }</strong>
                        </Typography>
                    </Grid>


                    <Grid item xs={12}>
                        <SelectInputForm
                            div_id="observed-data"
                            label="Observed Data"
                            list={[
                                { id: -1, label: "Actual rainfall data/observation is lower than recorded" },
                                { id: 0, label: "No rainfall observed; Actual data is zero" },
                                { id: 1, label: "Actual rainfall data/observation is higher than recorded" }
                            ]}
                            mapping={{ id: "id", label: "label" }}
                            required
                            value={observed_data}
                            error={observed_data === ""}
                            changeHandler={event => setObservedData(event.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            rowsMax="3"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    color="primary"
                    onClick={handleSubmit}
                    disabled={is_disabled}
                >
                    Submit
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default RainfallDataTaggingModal;
