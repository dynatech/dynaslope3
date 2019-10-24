import React, { Fragment, useState, useEffect } from "react";
import {
    TextField, Grid, withStyles
} from "@material-ui/core";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";

import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Checkbox from "@material-ui/core/Checkbox";

import { array } from "prop-types";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { sites } from "../../../store";


function prepareSitesOption (arr) {
    return arr.map(site => {
        const { 
            site_code, sitio, purok,
            barangay, municipality, province,
            site_id
        } = site;
        let address = sitio !== null ? `Sitio ${sitio}, ` : "";
        address += purok !== null ? `Purok ${purok}, ` : "";
        address += `Brgy. ${barangay}, ${municipality}, ${province}`;
        address = `${site_code.toUpperCase()} (${address})`;

        return { value: site_id, label: address, data: site };
    });
}

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
    }
});


function IssuesAndReminderForm (props) {
    const {
        classes, issueReminderData,
        setIssueReminderData
    } = props;
    const initial_cbx_state = false;
    const [is_event_checked, setIsEventChecked] = useState(initial_cbx_state);
    const [is_persistent_checked, setIsPersistentChecked] = useState(initial_cbx_state);
    // const [is_ts_hidden, setTSHidden] = useState(false);

    const {
        iar_id, site_id_list, detail, ts_posted_until,
        resolution, resolved_by, ts_posted, user_id,
        is_event_entry, is_persistent
    } = issueReminderData;

    useEffect(() => {
        setIsEventChecked(is_event_entry); 
        setIsPersistentChecked(is_persistent);

        if (iar_id !== "") {
            const site_choices = site_id_list.map((site_id) => {
                return sites_option.filter((number) => number.value === site_id)[0];
            });

            setIssueReminderData({
                ...issueReminderData,
                site_id_list: site_choices
            });
        }
    }, []);

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

    const switchHandler = () => event => {
        const { value, checked } = event.target;

        switch (value) {
            case "is_event_entry": 
                // if (!checked) setIsPersistentChecked(initial_cbx_state);
                setIsEventChecked(checked);
                if (!checked) setIsPersistentChecked(initial_cbx_state);
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
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >
                <Grid item xs={12} className={classes.inputGridContainer}>
                    <DynaslopeSiteSelectInputForm 
                        value={site_id_list}
                        changeHandler={update_site_value}
                        isMulti
                    />
                </Grid>
                {
                    site_id_list !== null && (
                        <Grid item xs={12} md={12}>
                            <FormControlLabel
                                key="test"
                                control={
                                    <Checkbox
                                        checked={is_event_checked}
                                        onChange={switchHandler()}
                                        value="is_event_entry"
                                        className={classes.checkboxes}
                                    />
                                }
                                label="Is event entry?"
                                className="primary"
                            />
                        </Grid>
                    )
                }
                {
                    (is_event_checked || site_id_list == null) && (
                        <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                            <FormControlLabel
                                key="test"
                                control={
                                    <Checkbox
                                        checked={is_persistent_checked}
                                        onChange={switchHandler()}
                                        value="is_persistent" 
                                        className={classes.checkboxes}
                                    />
                                }
                                label="Is persistent?"
                                className="primary"
                            />
                        </Grid> 
                    )
                }
                {/* <Grid item xs={12} sm={12} className={classes.inputGridContainer} hidden={is_ts_hidden}> */}
                {
                    !is_persistent_checked && (
                        <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                            <KeyboardDateTimePicker
                                autoOk
                                label="Posted Until"
                                value={ts_posted_until}
                                onChange={handleDateTime("ts_posted_until")}
                                ampm={false}
                                format="YYYY-MM-DD HH:mm:ss"
                                mask="____-__-__ __:__:__"
                                clearable
                                disableFuture
                            />
                        </Grid>
                    )
                }

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <TextField
                        required
                        id="standard-multiline-static"
                        label="Details"
                        value={detail}
                        onChange={handleEventChange("detail")}
                        placeholder="Enter detail"
                        multiline
                        rows="6"
                        rowsMax={8}
                        fullWidth
                        className={classes.textField}
                        variant="filled"
                    />
                </Grid>
                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <TextField
                        required
                        id="standard-multiline-static"
                        label="Resolution"
                        value={resolution}
                        onChange={handleEventChange("resolution")}
                        placeholder="Enter resolution"
                        multiline
                        rows="6"
                        rowsMax={8}
                        fullWidth
                        className={classes.textField}
                        variant="filled"
                    />
                </Grid>
                {/* <Grid item xs={12} sm={12} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="Reporter"
                        div_id="user_id"
                        changeHandler={handleEventChange("user_id")}
                        value={user_id}
                    />
                </Grid> */}
            </Grid>
        </MuiPickersUtilsProvider>           
    );
}


export default withStyles(styles)(IssuesAndReminderForm);
