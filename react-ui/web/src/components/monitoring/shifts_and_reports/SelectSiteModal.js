import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Checkbox,
    FormControl, FormControlLabel,
    Typography
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";

function processCheckboxValues (props) {
    const { eosData, selectedSite, setSelectedSite, index } = props;
    const selected = selectedSite;
    const final_eos_data = [];
    if (selected.includes(index) === false) {
        selected.push(index);
        setSelectedSite(selected);
    } else {
        selected.pop(index);
        setSelectedSite(selected);
    }

    selected.forEach(row => {
        final_eos_data.push(eosData[row]);
    });

    return final_eos_data;
}


function SelectSiteModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, eosData,
        setSelectedEosData, setModalOpen,
        setEosData
    } = props;

    const [selectedSite, setSelectedSite] = useState([]);
    const [final_eos_data, setFinalEosData] = useState([]);
    const handleChange = index => event => {
        const data = { eosData, selectedSite, setSelectedSite, index };
        setFinalEosData(processCheckboxValues (data));
    };
    const handleSubmit = () => {
        setSelectedEosData(final_eos_data);
        setModalOpen(false);
    };

    const handleCancel = () => {
        closeHandler();
        setEosData(null);
    };

    let no_sites = false;
    if (eosData !== null) {
        no_sites = eosData.length === 0;
    }


    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                maxWidth="sm"
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Select Site to Generate</DialogTitle>
                <DialogContent>
                    {
                        eosData === null && (
                            <CircularProgress style={{
                                position: "absolute", left: "50%", top: "50%"
                            }}/>
                        )
                    }
                    {
                        no_sites === true && (
                            <Typography variant="subtitle1" align="center">
                                No active sites.
                            </Typography>
                        )
                    }
                    {
                        eosData !== null && (
                            eosData.map((row, index) => {
                                const { site_code, event_id } = row;
                                const site_code_label = site_code.toUpperCase();
                                return (
                                    <FormControl key={event_id}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    key={event_id}
                                                    onChange={handleChange(index)}
                                                    value={site_code}
                                                    color="primary"
                                                />
                                            }
                                            label={site_code_label}
                                        />
                                    </FormControl>
                                );
                            })
                        )
                    }

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default withMobileDialog()(SelectSiteModal);
