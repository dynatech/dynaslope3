import React, { useState, useEffect } from "react";

import { useSnackbar } from "notistack";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, withStyles, Grid, Tooltip,
    FormControl, FormControlLabel, Checkbox
} from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { compose } from "recompose";
import { getRainInformation } from "../ajax";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

const styles = theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    },
    checkboxGridContainer: {
        marginTop: 12,
        marginBottom: 6
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        width: "90%",
    },
    backButton: {
        marginRight: 1
    },
    instructions: {
        marginTop: 1,
        marginBottom: 1,
    },
    link: { textDecoration: "none" }
});

function useFetchTagOptions (tag_selection) {
    const [tags, update_tags] = useState([]);

    useEffect(() => {
        // AJAX CALLS HERE FOR OPRIONS
        // axios.get(host + "/api/users/get_dynaslope_users")
        // .then(response => {
        //     const arr = prepareUsersArray(response.data);
        //     this.setState({ users: arr });
        // })
        // .catch(error => {
        //     console.log(error);
        // });

        let json = [];
        if (tag_selection === "messages") {
            json = [
                "#ewireponse", "#ewimessage", "#groundmeasreminder",
                "#groundmeas", "#groundobs", "#groundobsreminder"
            ].map(val => ({
                value: val,
                label: val
            }));
        }

        update_tags(json);
    }, [tag_selection]);

    return tags;
}

function getSiteCodes (site_list) {
    const site_codes = [];
    site_list.forEach((row, index) => {
        const { data: { site_code, barangay, municipality, province } } = row;
        const site_info = `Brgy. ${barangay}, ${municipality}, ${province}`;
        site_codes.push({ site_code, site_info });
    });

    return site_codes;
}

function LoadTemplateModal (props) {
    const {
        classes, fullScreen, isOpen,
        clickHandler, setComposedMessage
    } = props;

    const [date_time, setDateTime] = useState(moment().format("YYYY-MM-DD HH:mm:ss"));
    const [site_list, setSiteList] = useState(null);
    const [express, setExpress] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const update_datetime = value => setDateTime(moment(value).format("YYYY-MM-DD HH:mm:ss"));

    const update_site_value = value => {
        setSiteList(value);
    };

    const expressRainInfo = event => setExpress(event.target.checked);

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const getRainInformationFunction = () => {
        const site_details = getSiteCodes(site_list);
        const is_express = express;
        const as_of = moment(date_time).format("LLL");
        const final_data = {
            is_express,
            site_details,
            date_time,
            as_of
        };
        getRainInformation(final_data, data => {
            const { status, message, ewi } = data;
            const ewi_message = ewi.replace("<as_of>", as_of);
            setComposedMessage(ewi_message);
            if (status === true) {
                clickHandler();
                enqueueSnackbar(
                    message,
                    {
                        variant: "success",
                        autoHideDuration: 3000,
                        action: snackBarActionFn
                    }
                );
            } else {
                enqueueSnackbar(
                    message,
                    {
                        variant: "error",
                        autoHideDuration: 3000,
                        action: snackBarActionFn
                    }
                );
            }
        });
    };

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Load Templates
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select template to be loaded.
                </DialogContentText>
                <Grid
                    container 
                    spacing={1} 
                    alignItems="center"
                    justify="space-evenly"
                >
                    <Grid item xs={12} className={classes.inputGridContainer}>
                        <DynaslopeSiteSelectInputForm 
                            value={site_list}
                            changeHandler={update_site_value}
                            isMulti                    
                        />
                    </Grid>
                    <Grid item xs={6} className={classes.inputGridContainer}>
                        <Tooltip 
                            title="Example tooltip"
                            placement="top"
                            interactive
                        >
                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={express}
                                            onChange={expressRainInfo}
                                            value="checkedB"
                                            color="primary"
                                        />
                                    }
                                    label="Express data in percentage"
                                />
                            </FormControl>
                        </Tooltip>
                    </Grid>
                    <Grid item xs={6} className={classes.inputGridContainer}>
                    
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Data timestamp"
                                value={date_time}
                                onChange={update_datetime}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="__/__/____ __:__"
                                clearable
                                disableFuture
                            />
                        </MuiPickersUtilsProvider>
                    </Grid>
                </Grid>
               
            </DialogContent>
               
            <DialogActions>
                <Button color="primary" onClick={() => getRainInformationFunction()}>
                    Select
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default compose(withStyles(styles), withMobileDialog())(LoadTemplateModal);
