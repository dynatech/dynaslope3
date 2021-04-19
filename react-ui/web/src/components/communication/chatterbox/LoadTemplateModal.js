import React, { useState, useEffect } from "react";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, 
    makeStyles, Grid, Tooltip,
    FormControl, FormControlLabel, Checkbox
} from "@material-ui/core";

import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import { useSnackbar } from "notistack";

import { getRainInformation } from "../ajax";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

const useStyles = makeStyles(theme => ({
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
}));


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
        fullScreen, isOpen, inputFieldLength,
        clickHandler, setComposedMessage,
        maxCharacters
    } = props;

    const classes = useStyles();

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
            setComposedMessage(ewi.slice(0, inputFieldLength));
            
            let snackbar_message = message;
            let variant = "error";
            if (status === true) {
                clickHandler();
                variant = "success";
                if (ewi.length > inputFieldLength) {
                    variant = "warning";
                    snackbar_message = `Rainfall information message is trimmed down because of length restrictions (max characters: ${maxCharacters})`;
                }
            }

            enqueueSnackbar(
                snackbar_message,
                {
                    variant,
                    autoHideDuration: 3000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const [is_disabled, setIsDisabled] = useState(true);
    useEffect(() => {
        setIsDisabled(date_time === null || site_list === null);
    }, [date_time, site_list]);

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Load Rainfall Information
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill-up the form with needed data.
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
                <Button color="primary" onClick={() => getRainInformationFunction()} disabled={is_disabled}>
                    Select
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(LoadTemplateModal);
