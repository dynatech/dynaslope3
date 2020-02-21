import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Grid,
    FormControl, TextField
} from "@material-ui/core";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { useSnackbar } from "notistack";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { insertEarthquakeEvent } from "../ajax";
import { getCurrentUser } from "../../sessions/auth";

function InsertEQevent (props) {
    const {
        fullScreen, isOpen, clickHandler, setReloadEqEvent
    } = props;
    const [eq_magnitude, set_magnitude] = useState(null);
    const [eq_depth, set_depth] = useState(null);
    const [eq_long, set_long] = useState(0);
    const [eq_lat, set_lat] = useState(0);
    const [ts, setTs] = useState(moment());
    const update_ts_end = value => setTs(value);
    const [is_disable, set_is_disabled] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { first_name, last_name } = getCurrentUser();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };
    
    useEffect(() => setTs(moment()), [isOpen]);

    useEffect(() => {
        if (eq_depth > 0 && eq_long > 0 && eq_lat > 0 && eq_magnitude >= 0 && eq_magnitude <= 10) {
            set_is_disabled(false);
        } else { 
            set_is_disabled(true); 
        }
    }, [eq_depth, eq_magnitude, eq_lat, eq_long]);

    const saveEQ = () => {
        const user = `${first_name } ${ last_name}`.split(" ");
        let issuer = "";
        user.forEach(element => {
            issuer += element.charAt(0);
        });
        const eq_data = {
            magnitude: eq_magnitude,
            depth: eq_depth,
            "long": eq_long,
            lat: eq_lat,
            timestamp: ts.format("YYYY-MM-DD HH:mm"),
            issued_by: issuer
        };

        insertEarthquakeEvent(eq_data, response => {
            if (response.status === 200) {
                enqueueSnackbar(
                    "Success saving earthquake event",
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
                setReloadEqEvent(true);
            } else {
                enqueueSnackbar(
                    "Error saving earthquake event",
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        });

        clickHandler(false);
    };

    const magnitude_err = (eq_magnitude > 10 || eq_magnitude <= 0) && eq_magnitude !== null;
    const depth_err = eq_depth <= 0 && eq_magnitude !== null;
    
    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Insert Earthquake Event
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill in the following.
                </DialogContentText>

                <Grid container spacing={2}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12}> 
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Data Timestamp"
                                value={ts}
                                onChange={update_ts_end}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="____/__/__ __:__"
                                clearable
                                disableFuture
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>

                    <Grid item xs={6}>
                        <FormControl component="fieldset" fullWidth>
                            <TextField
                                required
                                label="Magnitude"
                                onChange={event => set_magnitude(event.target.value)}
                                type="number"
                                InputProps={{ inputProps: { 
                                    max: 10, min: 1
                                } }}
                                fullWidth
                                helperText={ magnitude_err ? "Insert magnitude from 0.1 to 10" : ""}
                                error={magnitude_err}
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                        <FormControl component="fieldset" fullWidth>
                            <TextField
                                required
                                label="Depth (km)"
                                defaultValue=""
                                onChange={event => set_depth(event.target.value)}
                                type="number"
                                fullWidth
                                helperText={ depth_err ? "Positive numbers only" : ""}
                                error={depth_err} 
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                        <FormControl component="fieldset" fullWidth>
                            <TextField
                                type="number"
                                required
                                label="Latitude"
                                defaultValue=""
                                onChange={event => set_lat(event.target.value)}
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                        <FormControl component="fieldset" fullWidth>
                            <TextField 
                                required
                                label="Longitude"
                                type="number"
                                defaultValue=""
                                onChange={event => set_long(event.target.value)}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button 
                    color="primary"
                    onClick={() => saveEQ()}
                    disabled ={is_disable}
                >
                    Submit
                </Button>
                <Button onClick={clickHandler} color="secondary" >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(InsertEQevent);
