import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Grid
} from "@material-ui/core";

import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { Link } from "react-router-dom";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";


function InsertNarrativeModal (props) {
    const {
        fullScreen, isOpen,
        clickHandler, isMobile,
        url
    } = props;
    const [site_value, setSiteValue] = useState([]);
    const update_site_value = value => setSiteValue(value);
    const [ts_end, setTsEnd] = useState(moment());

    const update_ts_end = value => setTsEnd(value);

    useEffect(() => {
        return (() => {
            setTsEnd(moment());
        });
    }, [isOpen]);

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Consolidate charts per site
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill in the following.
                </DialogContentText>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DynaslopeSiteSelectInputForm
                            value={site_value}
                            changeHandler={update_site_value}
                        />
                    </Grid>

                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12}>
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Data Timestamp"
                                value={ts_end}
                                onChange={update_ts_end}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="__/__/____ __:__"
                                clearable
                                disableFuture
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>
                </Grid>

                {
                    !isMobile && <div style={{ height: 240 }} />
                }
            </DialogContent>
            <DialogActions>
                <Button 
                    component={Link}
                    to={{
                        pathname: `${url}/consolidated/${site_value.value}`,
                        ts_end,
                        site: site_value.data
                    }}
                    color="primary"
                    onClick={clickHandler}
                    disabled={site_value.length === 0}
                >
                    Submit
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(InsertNarrativeModal);
