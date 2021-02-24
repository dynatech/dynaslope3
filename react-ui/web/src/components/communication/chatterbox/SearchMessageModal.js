import React, {
    useState, useEffect, useContext, Fragment
} from "react";
import { Link } from "react-router-dom";

import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton,
    makeStyles, FormControlLabel,
    Checkbox, Grid, Divider, Typography,
    TextField, FormControl
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import moment from "moment";

import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { GeneralContext } from "../../contexts/GeneralContext";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

const useStyles = makeStyles(theme => ({
    link: { textDecoration: "none" }
}));

function SearchMessageModal (props) {
    const {
        fullScreen, modalStateHandler,
        setSearchResultsToEmpty,
        modalState, url, isMobile,
        recipientsList, tagList
    } = props;
    const classes = useStyles();

    const {
        organizations: orgs_list
    } = useContext(GeneralContext);

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

    const [sites, setSites] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [only_ewi_recipients, setOnlyEwiRecipients] = useState(false);
    const [include_inactive_numbers, setIncludeInactiveNumbers] = useState(false);
    const [ts_start, setTsStart] = useState(null);
    const [ts_end, setTsEnd] = useState(null);
    const [string_search, setString] = useState("")
    const [tag_search, setTags] = useState({label: ""})
    const [mobile_number_search, setMobileNumber] = useState("")
    const [name_search, setName] = useState("")

    const [is_search_disabled, setIsSearchDisabled] = useState(true);
    const has_site_or_org = sites.length > 0 || organizations.length > 0;
    const are_ts_all_null = [ts_start, ts_end].every(x => x === null);
    const has_message_filters = [ts_start, ts_end].every(x => x !== null) || are_ts_all_null;

    const compound_fn = () => {
        modalStateHandler();
        setSearchResultsToEmpty();
    };

    useEffect(() => {
        let bool = true;

        if (has_site_or_org) {
            if (has_message_filters) bool = false;
        } else if (has_message_filters && !are_ts_all_null) bool = false;

        if(mobile_number_search || name_search || string_search || tag_search.label){
            bool = false
        }
        
        setIsSearchDisabled(bool);
    }, [sites, organizations, ts_start, ts_end,
        mobile_number_search, name_search, string_search,
        tag_search]);

    useEffect(() => {
        if (typeof recipientsList !== "undefined") {
            
            const temp = recipientsList.map(row => {
                const { label, mobile_id, org, sim_num } = row;
                let fin_label = label;
                if (org !== "") fin_label = `${label} (${org})`;

                const chip_label = `${label}`;
                const name = chip_label.split(",");
                return {
                    label: fin_label,
                    chipLabel: chip_label,
                    value: mobile_id,
                    sim_num,
                    data: row,
                    first_name: name[1],
                    last_name: name[0]
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
                            changeHandler={value => setSites(value || [])}
                            isMulti
                        />     
                    </Grid>

                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Organization(s)"
                            options={org_options}
                            value={organizations}
                            changeHandler={value => setOrganizations(value || [])}
                            placeholder="Select organization(s)"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                            isMulti
                        />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        MESSAGE FILTERS
                    </Typography>
                
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12} sm={6}> 
                            <KeyboardDateTimePicker
                                autoOk
                                label="Start Date/Time"
                                value={ts_start}
                                onChange={value => setTsStart(value)}
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
                                onChange={value => setTsEnd(value)}
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
                    
                    <Grid item xs={12}><Divider /></Grid>
                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        STRING FILTER
                    </Typography>
                    
                    <Grid item xs={12}>
                        <FormControl fullWidth> 
                            <TextField
                                id="string-filter"
                                label="String"
                                value={string_search}
                                onChange={e => setString(e.target.value)}
                                placeholder="Enter string"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>
                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        TAG FILTER
                    </Typography>
                    
                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Tags"
                            options={tagList}
                            value={tag_search}
                            changeHandler={value => setTags(value)}
                            placeholder="Select tags"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                        />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>
                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        MOBILE NUMBER FILTER
                    </Typography>
                    
                    <Grid item xs={12}>
                        <FormControl fullWidth> 
                            <TextField
                                id="mobile-number-filter"
                                label="Mobile Number"
                                type="number"
                                value={mobile_number_search}
                                onChange={e => setMobileNumber(e.target.value)}
                                placeholder="Enter mobile number"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>
                    <Typography
                        variant="subtitle1"
                        component={Grid} item xs={12}
                    >
                        NAME FILTER
                    </Typography>
                    
                    <Grid item xs={12}>
                        <SelectMultipleWithSuggest
                            label="Contacts"
                            options={options}
                            value={name_search}
                            changeHandler={value => setName(value)}
                            placeholder="Select contact"
                            renderDropdownIndicator
                            openMenuOnClick
                            isMulti
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
                                            onChange={x => setOnlyEwiRecipients(x.target.checked)}
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
                                            onChange={x => setIncludeInactiveNumbers(x.target.checked)}
                                            name="includeInactiveNumbers"
                                        />
                                    }
                                    label="Include inactive numbers"
                                />  
                            </Grid>
                        </Fragment>
                    }
                </Grid>

                {
                    !isMobile && <div style={{ height: 100 }} />
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={modalStateHandler}>
                    Cancel
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
