import React, { useState, useEffect, Fragment } from "react";
import {
    TextField, Grid, withStyles, Divider
} from "@material-ui/core";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";

import DynaslopeSiteSelectInputForm, { prepareSitesOption } from "../../reusables/DynaslopeSiteSelectInputForm";
import { sites } from "../../../store";

const sites_option = prepareSitesOption(sites);

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
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
    },
    justify: {
        display: "flex",
        justifyContent: "space-evenly"
    }
});


function IssuesAndReminderForm (props) {
    const {
        classes, issueReminderData,
        setIssueReminderData, fullScreen,
        toResolve
    } = props;

    const {
        iar_id, detail, ts_expiration,
        resolution, is_event_entry, site_id_list
    } = issueReminderData; 
    const [default_radio_value, set_default_radio_value] = useState("general");
    const [radio_value, setRadioValue] = useState(default_radio_value);
    const [is_general_iar, setIsGeneralIar] = useState(radio_value);
    const [is_event_checked, setIsEventChecked] = useState(false);
    const [is_persistent_checked, setIsPersistentChecked] = useState(false);

    useEffect(() => {
        setIsEventChecked(is_event_entry);

        if (iar_id !== "" && typeof iar_id !== "undefined") {
            const site_choices = site_id_list.map(site_id => {
                return sites_option.filter(number => number.value === site_id).pop();
            });

            setIssueReminderData({
                ...issueReminderData,
                site_id_list: site_choices
            });
        }
        
        if (site_id_list !== null && typeof site_id_list !== "undefined" ) {
            if (site_id_list.length > 0) {
                set_default_radio_value("site");
                setRadioValue("site");
                setIsGeneralIar("site");    
            }           
        }
        
        if (ts_expiration === null) {
            setIsPersistentChecked(true);
        }
    }, []);
   
    useEffect(() => {
    }, [issueReminderData]);

    const handleRadioChange = event => {
        const { target: { value } } = event;
        setRadioValue(value);
        setIsGeneralIar(value);
    };

    const handleDateTime = key => value => {
        setIssueReminderData({
            ...issueReminderData,
            [key]: value  
        });
    };

    const update_site_value = (value) => setIssueReminderData({
        ...issueReminderData,
        site_id_list: value  
    });

    const handleEventChange = key => event => {
        const { value } = event.target;

        setIssueReminderData({
            ...issueReminderData,
            [key]: value  
        });
    };

    const switchHandler = event => {
        const { value, checked } = event.target;

        switch (value) {
            case "is_event_entry": 
                setIsEventChecked(checked);
                if (!checked) setIsPersistentChecked(false);
                setIssueReminderData({
                    ...issueReminderData,
                    is_event_entry: checked
                });
                break;
            case "is_persistent":
                setIsPersistentChecked(checked);
                setIssueReminderData({
                    ...issueReminderData,
                    is_persistent: checked
                });
                break;
            default:
                break;
        }
    };

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            {
                !toResolve ? (
                    <Grid
                        container
                        spacing={1}
                    >
                        <Grid item xs={12}>
                            <RadioGroup
                                aria-label="position"
                                name="position"
                                value={radio_value}
                                onChange={handleRadioChange}
                                row
                                className={fullScreen ? "" : classes.justify}
                            >
                                <FormControlLabel
                                    value="general"
                                    control={<Radio color="primary" />}
                                    label="General issue/reminder"
                                    labelPlacement="end"
                               
                                />
                                <FormControlLabel
                                    value="site"
                                    control={<Radio color="primary" />}
                                    label="Site-specific issue/reminder"
                                    labelPlacement="end"
                                          
                                />
                            </RadioGroup>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider style={{ marginBottom: 8 }} />
                        </Grid>

                        {
                            is_general_iar === "site" && (
                                <Fragment>
                                    <Grid item xs={12}>
                                        <DynaslopeSiteSelectInputForm 
                                            value={site_id_list}
                                            changeHandler={update_site_value}
                                            isMulti
                                            includeAddressOnOptions={false}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            key="is_event_entry"
                                            control={
                                                <Checkbox
                                                    checked={is_event_checked}
                                                    onChange={switchHandler}
                                                    value="is_event_entry"
                                                    className={classes.checkboxes}
                                                />
                                            }
                                            label={
                                                <div>
                                                Related to current monitoring event <Tooltip
                                                        title="Checking this will make the issue/reminder expire at the end of site(s) current monitoring event validity"><strong>[?]</strong></Tooltip>
                                                </div>
                                            }
                                            className="primary"
                                        />
                                    </Grid>
                                </Fragment>
                            )
                        }
                        {
                            (is_general_iar || !is_event_checked) && (
                                <Fragment>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            key="is_persistent"
                                            control={
                                                <Checkbox
                                                    checked={is_persistent_checked}
                                                    onChange={switchHandler}
                                                    value="is_persistent" 
                                                    className={classes.checkboxes}
                                                />
                                            }
                                            label="Persistent reminder"
                                            className="primary"
                                        />
                                    </Grid>
                            
                                    {
                                        !is_persistent_checked ? (
                                            <Grid item xs={12} md={6}>
                                                <KeyboardDateTimePicker
                                                    autoOk
                                                    label="Issue/Reminder Expiration"
                                                    value={ts_expiration}
                                                    onChange={handleDateTime("ts_expiration")}
                                                    ampm={false}
                                                    format="YYYY-MM-DD HH:mm:ss"
                                                    mask="____-__-__ __:__:__"
                                                    clearable
                                                />
                                            </Grid>
                                        ) : (
                                            <Grid item md={6} />
                                        )
                                    }
                                </Fragment>
                            )
                        }
                    
                        <Grid item xs={12}>
                            <Divider style={{ margin: "8px 0" }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                required
                                label="Details"
                                value={detail}
                                onChange={handleEventChange("detail")}
                                placeholder="Enter detail"
                                multiline
                                rowsMax={6}
                                fullWidth
                                className={classes.textField}
                            />
                        </Grid>
                    
                    </Grid>
                ) : (
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                label="Resolution"
                                value={resolution || ""}
                                onChange={handleEventChange("resolution")}
                                placeholder="Enter resolution"
                                multiline
                                rowsMax={6}
                                fullWidth
                                className={classes.textField}
                            />
                        </Grid>                        
                    </Grid>
                )
            }
        </MuiPickersUtilsProvider>           
    );
}


export default withStyles(styles)(IssuesAndReminderForm);
