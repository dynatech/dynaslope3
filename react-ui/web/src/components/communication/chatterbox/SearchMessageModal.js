import React, {
    useState, useEffect, useContext, Fragment
} from "react";
import { Link } from "react-router-dom";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, FormControlLabel,
    Checkbox, Grid, Divider, Typography,
    TextField, FormControl
} from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import moment from "moment";

import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

import { GeneralContext } from "../../contexts/GeneralContext";
import { CommsContext } from "./CommsContext";


function SearchMessageModal (props) {
    const {
        fullScreen, modalStateHandler,
        setSearchResultsToEmpty,
        modalState, url, tagList,
        recipientsList
    } = props;

    const { organizations: orgs_list } = useContext(GeneralContext);
    const { search_state, search_dispatch } = useContext(CommsContext);

    const { 
        sites, orgs: organizations, only_ewi_recipients, include_inactive_numbers,
        ts_start, ts_end, string_search, tag_search, mobile_number_search,
        name_search
    } = search_state;

    const [org_options, setOrgOptions] = useState([]);
    const [options, setOptions] = useState([]);
    useEffect(() => {
        const temp = orgs_list.map(row => {
            let pre = "";
            switch (row.scope) {
                case 1:
                    pre = "Barangay "; break;
                case 2:
                    pre = "Municipal "; break;
                case 3:
                    pre = "Provincial "; break;
                case 4:
                    pre = "Regional "; break;
                case 5:
                    pre = "National "; break;
                default:
                    break;
            }

            return {
                value: row.org_id,
                label: pre + row.name.toUpperCase()
            };
        });
        setOrgOptions(temp);
    }, [orgs_list]);

    const [is_search_disabled, setIsSearchDisabled] = useState(true);
    const has_site_or_org = sites.length > 0 || organizations.length > 0;
    const are_ts_all_null = [ts_start, ts_end].every(x => x === null);
    const has_date_filter = [ts_start, ts_end].every(x => x !== null) || are_ts_all_null;

    const compound_fn = () => {
        modalStateHandler();
        setSearchResultsToEmpty();
    };

    useEffect(() => {
        let bool = true;

        if (has_site_or_org) {
            if (has_date_filter) bool = false;
        } else if (has_date_filter && !are_ts_all_null) bool = false;

        if (mobile_number_search || name_search || string_search || tag_search.label) {
            bool = false;
        }
        
        setIsSearchDisabled(bool);
    }, [
        sites, organizations, ts_start, ts_end,
        mobile_number_search, name_search, string_search,
        tag_search, are_ts_all_null, has_date_filter,
        has_site_or_org
    ]);

    useEffect(() => {
        if (typeof recipientsList !== "undefined") {
            const temp = recipientsList.map(row => {
                const { label, mobile_id, org, sim_num } = row;
                let fin_label = label;
                if (org !== "") fin_label = `${label} (${org})`;
                fin_label += ` - ${sim_num}`;

                const chip_label = `${label} - ${sim_num}`;

                return {
                    label: fin_label,
                    chipLabel: chip_label,
                    value: mobile_id,
                    sim_num,
                    data: row
                };
            });

            setOptions(temp);
        }
    }, [recipientsList]);

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={modalState}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}
                
        >
            <DialogTitle id="form-dialog-title">
                Search Chatterbox
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    Fill in at least one field from any of the filters. NOTE: the broader the search 
                    filters, the longer the query might run.
                </DialogContentText>

                <Grid container spacing={2}>
                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        CONTACT FILTERS
                    </Typography>

                    <Grid item xs={12}>
                        <DynaslopeSiteSelectInputForm
                            value={sites}
                            changeHandler={value => search_dispatch({ type: "UPDATE_SITES", value })}
                            isMulti
                            disabled={
                                Boolean(mobile_number_search || name_search)
                            }
                        />     
                    </Grid>

                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Organization(s)"
                            options={org_options}
                            value={organizations}
                            changeHandler={value => search_dispatch({ type: "UPDATE_ORGS", value })}
                            placeholder="Select organization(s)"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                            isMulti
                            isDisabled={
                                Boolean(mobile_number_search || name_search)
                            }
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" align="center">OR</Typography>    
                    </Grid>

                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Saved Contact"
                            options={options}
                            value={name_search}
                            changeHandler={value => search_dispatch({ type: "UPDATE_NAME_SEARCH", value })}
                            placeholder="Select contact"
                            renderDropdownIndicator
                            openMenuOnClick
                            isMulti
                            isDisabled={Boolean(has_site_or_org || mobile_number_search)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" align="center">OR</Typography>    
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth> 
                            <TextField
                                id="mobile-number-filter"
                                label="Mobile Number"
                                type="number"
                                value={mobile_number_search}
                                onChange={e => search_dispatch({ type: "UPDATE_MOBILE_NUMBER_SEARCH", value: e.target.value })}
                                placeholder="Start number entry with 639 or enter last four digits"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled={Boolean(has_site_or_org || name_search)}
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        MESSAGE FILTERS
                    </Typography>

                    <Typography
                        variant="subtitle2"
                        component={Grid} item xs={12}
                    >
                        Note: Date filters required for tag and string search.
                    </Typography>
                
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12} sm={6}> 
                            <KeyboardDateTimePicker
                                autoOk
                                label="Start Date/Time"
                                value={ts_start}
                                onChange={value => search_dispatch({ type: "UPDATE_TS_START", value })}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="____/__/__ __:__"
                                clearable
                                disableFuture
                                fullWidth
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                error={ts_start === null && ts_end !== null}
                                helperText={
                                    ts_start === null && ts_end !== null &&
                                    "Both date/time must have values"
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}> 
                            <KeyboardDateTimePicker
                                autoOk
                                label="End Date/Time"
                                value={ts_end}
                                onChange={value => search_dispatch({ type: "UPDATE_TS_END", value })}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="____/__/__ __:__"
                                clearable
                                disableFuture
                                fullWidth
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                error={ts_start !== null && ts_end === null}
                                helperText={
                                    ts_start !== null && ts_end === null &&
                                    "Both date/time must have values"
                                }
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>
               
                    <Grid item xs={12}>
                        <FormControl fullWidth> 
                            <TextField
                                id="string-filter"
                                label="Keyword"
                                value={string_search}
                                onChange={e => search_dispatch({ type: "UPDATE_STRING_SEARCH", value: e.target.value })}
                                placeholder="Enter keyword"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled={are_ts_all_null}
                            />
                        </FormControl>
                    </Grid>
        
                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Tags"
                            options={tagList}
                            value={tag_search}
                            changeHandler={value => search_dispatch({ type: "UPDATE_TAG_SEARCH", value })}
                            placeholder="Select tags"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                            isDisabled={are_ts_all_null}
                            isClearable
                        />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    {
                        !is_search_disabled && <Fragment>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={only_ewi_recipients}
                                            onChange={x => search_dispatch({ type: "UPDATE_ONLY_EWI_RECIPIENTS", value: x.target.checked })}
                                            name="onlyEWIRecipients"
                                        />
                                    }
                                    label="Only EWI recipients"
                                />  
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={include_inactive_numbers}
                                            onChange={x => search_dispatch({ type: "UPDATE_INCLUDE_INACTIVE_NUMBERS", value: x.target.checked })}
                                            name="includeInactiveNumbers"
                                        />
                                    }
                                    label="Include inactive numbers"
                                />  
                            </Grid>
                        </Fragment>
                    }
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={modalStateHandler}>
                    Cancel
                </Button>
                <Button onClick={() => search_dispatch({ type: "RESET" })}>
                    RESET
                </Button>
                <Button
                    onClick={compound_fn}
                    color="secondary"
                    disabled={is_search_disabled}
                    component={Link}
                    to={{
                        pathname: `${url}/search_results`,
                        state: {
                            sites, organizations, only_ewi_recipients, include_inactive_numbers,
                            ts_start: ts_start ? moment(ts_start).format("YYYY-MM-DD HH:mm:ss") : ts_start,
                            ts_end: ts_end ? moment(ts_end).format("YYYY-MM-DD HH:mm:ss") : ts_end,
                            string_search,
                            tag_search,
                            mobile_number_search,
                            name_search
                        }
                    }} 
                >
                    Search
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(SearchMessageModal);
