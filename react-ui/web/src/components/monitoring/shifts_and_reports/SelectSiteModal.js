import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Checkbox,
    FormControl, FormControlLabel,
    Typography, IconButton, Grid,
    CircularProgress
} from "@material-ui/core";
import { DoneAll } from "@material-ui/icons";

function processCheckboxValues (props) {
    const { 
        selectedSites, setSelectedSites,
        site_code, checkAll
    } = props;

    const selected = selectedSites;

    if (!selected.includes(site_code)) {
        selected.push(site_code);
    } else if (!checkAll) {
        const index = selected.indexOf(site_code);
        selected.splice(index, 1);
    }

    setSelectedSites([...selected]);
}

function SelectSiteModal (props) {
    const {
        fullScreen, isOpen,
        closeHandler, eosData,
        setSelectedEosData, setModalOpen,
        setEosData
    } = props;

    const [selectedSites, setSelectedSites] = useState([]);
    const [checkAll, setCheckAll] = useState(true);
 
    const handleChange = site_code => event => {
        const data = { selectedSites, setSelectedSites, site_code };
        processCheckboxValues(data);
    };

    const handleSubmit = () => {
        const final_eos_data = eosData.filter(row => selectedSites.includes(row.site_code));
        setSelectedEosData(final_eos_data);
        setModalOpen(false);
    };

    const handleCancel = () => {
        closeHandler();
        setEosData(null);
    };

    const handleCheckAll = () => {
        eosData.forEach(row => {
            const { site_code } = row;
            const data = { selectedSites, setSelectedSites, site_code, checkAll };
            processCheckboxValues(data);
        });
        setCheckAll(!checkAll);
    };
    
    const no_sites = eosData !== null && eosData.length === 0;

    return (
        <div>
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={isOpen}
                maxWidth="sm"
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Generate End-of-Shift Report</DialogTitle>
                <DialogContent>
                    <DialogContentText>Select sites to create end-of-shift report.</DialogContentText>
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
                            <Grid container alignItems="baseline">
                                <IconButton onClick={handleCheckAll} style={{ marginRight: 6 }} aria-label="Select all">
                                    <DoneAll/>
                                </IconButton>

                                {
                                    eosData.map(row => {
                                        const { site_code, event_id } = row;
                                        const checked = selectedSites.includes(site_code);
                                        const site_code_label = site_code.toUpperCase();
                                        return (
                                            <FormControl key={event_id}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            key={event_id}
                                                            onChange={handleChange(site_code)}
                                                            value={site_code}
                                                            color="primary"
                                                            checked={checked}
                                                        />
                                                    }
                                                    label={site_code_label}
                                                />
                                            </FormControl>
                                        );
                                    })
                                }
                            </Grid>
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
