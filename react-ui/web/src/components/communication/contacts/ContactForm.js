import React, {
    useState, useEffect, useReducer, Fragment
} from "react";

import {
    Button, Grid, Typography,
    IconButton, Avatar, TextField,
    Hidden, Divider, FormControlLabel, 
    Checkbox, FormControl
} from "@material-ui/core";
import { 
    Delete as DeleteIcon,
    Close, Person, AddCircle
} from "@material-ui/icons";
import { useSnackbar } from "notistack";

import MaskedInput, { conformToMask } from "react-text-mask";

import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { saveContact } from "../ajax";
import { sendWSMessage } from "../../../websocket/communications_ws";

const offices_obj = {
    "0": ["LEWC"],
    "1": ["LGU", "NGO"],
    "2": ["LGU", "NGO", "PNP"],
    "3": ["LGU", "NGO", "PNP"],
    "4": ["NGO", "OCD", "PHIVOLCS", "DOST"],
    "5": ["NGO", "OCD", "PHIVOLCS", "DOST", "MGB"]
};

const mobile_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
const conforming_mobile_mask = ["(", "+", /\d/, /\d/, /\d/, ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];

function TextMaskCustom (props) {
    const { inputRef, mask, ...other } = props;
  
    return (
        <MaskedInput
            {...other}
            ref={ref => {
                inputRef(ref ? ref.inputElement : null);
            }}
            mask={mask}
            placeholderChar="x"
            showMask
            keepCharPositions
        />
    );
}

function conformTextMask (mobile_number) {
    const { conformedValue } = conformToMask(mobile_number, conforming_mobile_mask);

    return conformedValue;
}

function removeNumberMask (data, type) {
    const altered_data = [];
    if (type === "mobile") {
        data.forEach((row, index) => {
            row.sim_num = row.sim_num.replace(/[()+-\s]/g, "");
            altered_data.push(row);
        });
    } else {
        data.forEach((row, index) => {
            delete row.mobile_id;
            const { landline_id } = row;

            if (landline_id === undefined) {
                row.landline_id = 0;
            }
            row.landline_num = row.landline_num.replace(/[()+-\s]/g, "");
            altered_data.push(row);
        });
    }

    return altered_data;
}

function userAffiliation (scope, site_details) {
    const { municipality, province, region, site_id } = site_details;
    let site = "";
    let location = "";

    if (scope === 0 || scope === 1) {
        site = { value: site_id };
        location = "";
    } else if (scope === 2) {
        site = "";
        location = municipality;
    } else if (scope === 3) {
        site = "";
        location = province;
    } else if (scope === 4) {
        site = "";
        location = region;
    }

    return {
        site,
        location
    };
}

function contactFormValidation (user_details, contact_numbers, affiliation) {
    const { first_name, last_name } = user_details;
    const { scope, site, office, location } = affiliation;
    const { mobile_nums, landline_nums } = contact_numbers;
    let is_sim_num_invalid = false;
    let is_affiliation_invalid = false;
    let is_landline_num_invalid = false;
    let button_state = null;

    mobile_nums.forEach((row, index) => {
        const { sim_num } = row;
        if (is_sim_num_invalid === false) {
            if (sim_num === "") { is_sim_num_invalid = true; }
            else { is_sim_num_invalid = sim_num.includes("x"); }
        }
    });

    if (landline_nums.length !== 0)
        landline_nums.forEach((row, index) => {
            const { landline_num } = row;
            if (is_landline_num_invalid === false) {
                if (landline_num === "") { is_landline_num_invalid = true; }
                else { is_landline_num_invalid = landline_num.includes("x"); }
            }
        });

    if (scope === 0 || scope === 1) {
        if (site === "" || office === "") { is_affiliation_invalid = true; }
        else { is_affiliation_invalid = false; }
    } else if (scope === 2 || scope === 3 || scope === 4) {
        if (location === "" || office === "") { is_affiliation_invalid = true; }
        else { is_affiliation_invalid = false; }
    } else if (scope === 5) {
        if (location === "") { is_affiliation_invalid = true; }
        else { is_affiliation_invalid = false; }
    }

    if (first_name === "" || last_name === "" || is_sim_num_invalid === true || is_affiliation_invalid === true || is_landline_num_invalid === true) {
        button_state = true;
    } else { button_state = false; }

    return button_state;
}

function reducerFunction (state, action) {
    const { type, category, payload } = action;
    const state_copy = [...state];

    let addend = {
        mobile_id: 0, status: 1, has_delete: true
    };
    if (category === "email") {
        addend = "";
    } else if (category === "mobile") {
        addend = { ...addend, sim_num: "" };
    } else if (category === "landline") {
        addend = { ...addend, landline_num: "" };
    }

    switch (type) {
        case "UPDATE":
            if (category === "email") {
                state_copy[payload.key] = payload.value;
            } else {
                state_copy[payload.key][payload.data] = payload.value;
            }
            return [...state_copy];
        case "ADD":
            return [...state_copy, addend];
        case "DELETE":
            state_copy.splice(payload.key, 1);
            return [...state_copy];
        default:
            break;
    }
}

function ContactForm (props) {
    const { 
        municipalities, provinces, regions,
        setContactForm, chosenContact, isEditMode,
        setContactFormForEdit, handleClose, isFromChatterbox
    } = props;

    let initial_mobiles = [{
        mobile_id: 0, sim_num: "", status: 1
    }];
    let initial_landlines = [];
    let initial_emails = [];
    let initial_scope = 0;
    let initial_office = "";
    let initial_site = "";
    let initial_location = "";
    let initial_status = 1;
    let initial_ewi_recipient = true;
    let initial_ewi_restriction = 0;
    const initial_save_button_state = false;
    let initial_user_details = {
        first_name: "", last_name: "",
        middle_name: "", nickname: "", user_id: 0
    };
    
    if (isEditMode) {
        const { mobile_numbers, user: {
            ewi_recipient, ewi_restriction, landline_numbers, emails, first_name,
            last_name, middle_name, nickname, user_id, organizations, status
        } } = chosenContact;
        initial_user_details = { first_name, last_name, middle_name, nickname, user_id };
        
        if (organizations.length !== 0) {
            const { scope, name } = organizations[0].organization;
            const site_details = organizations[0].site;
            initial_scope = scope;
            initial_office = name;
            const { site, location } = userAffiliation(scope, site_details);
            initial_site = site;
            initial_location = location;
    
        }

        if (ewi_restriction !== null) {
            if (ewi_restriction.length !== 0) {
                const { alert_level } = ewi_restriction;
                initial_ewi_restriction = alert_level;
            }
        }
        const updated_mobile_numbers = mobile_numbers.map((row, index) => {
            const new_data = JSON.parse(JSON.stringify(row));
            new_data.sim_num = conformTextMask(new_data.sim_num);
            return new_data;
        });

        initial_mobiles = updated_mobile_numbers;
        initial_landlines = landline_numbers;
        initial_emails = emails;
        initial_ewi_recipient = ewi_recipient === 1;
        initial_status = status === 1;
    }

    const scope_list = [
        { id: 0, label: "Community" },
        { id: 1, label: "Barangay" },
        { id: 2, label: "Municipal", select_label: "Municipality", list: municipalities },
        { id: 3, label: "Provincial", select_label: "Province", list: provinces },
        { id: 4, label: "Regional", select_label: "Region", list: regions },
        { id: 5, label: "National" }
    ];

    const restriction_list = [
        { id: 0, label: "No restrictions" },
        { id: 1, label: "Do not send on Alert 1" },
        { id: 2, label: "Do not send on Alert 2 and below" }
    ];
    const [user_details, setUserDetails] = useState(initial_user_details);
    const [scope, setScope] = useState(initial_scope);
    const [site, setSite] = useState(initial_site);
    const [location, setLocation] = useState(initial_location);
    const [offices, setOffices] = useState([]);
    const [office, setOffice] = useState(initial_office);
    const [mobile_nums, setMobileNums] = useReducer(reducerFunction, initial_mobiles);
    const [landline_nums, setLandlineNums] = useReducer(reducerFunction, initial_landlines);
    const [emails, setEmails] = useReducer(reducerFunction, initial_emails);
    const [is_ewi_recipient, setEwiRecipient] = useState(initial_ewi_recipient);
    const [is_active, setIsActive] = useState(initial_status);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [restriction, setRestriction] = useState(initial_ewi_restriction);
    const [save_button_state, setSaveButtonState] = useState(initial_save_button_state);

    const closeButtonFn = () => {
        if (isFromChatterbox) handleClose();
        if (isEditMode) return setContactFormForEdit(false);
        return setContactForm(false);
    };

    const nameChangeHandler = attr => event => {
        setUserDetails({ ...user_details, [attr]: event.target.value });
    };

    const ewiRecipientHandler = event => setEwiRecipient(event.target.checked);
    const isActiveHandler = event => setIsActive(event.target.checked);

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    useEffect(() => {
        let office_list = [];
        if (scope !== "") {
            office_list = offices_obj[scope];
            const o = office_list.map(x => ({ id: x.toLowerCase(), label: x }));
            setOffices(o);
            if (!isEditMode) {
                setSite("");
                setLocation("");
                setOffice("");
            }
        }
        
    }, [scope]);


    const [final_obj, setFinalObj] = useState({});

    useEffect(() => {
        setFinalObj({
            user: {
                ...user_details
            }
        });

        let button_state = true;
        const affiliation = {
            scope, site, office, location
        };

        const contact_numbers = {
            mobile_nums, landline_nums
        };

        button_state = contactFormValidation(user_details, contact_numbers, affiliation);
        setSaveButtonState(button_state);

    }, [user_details, mobile_nums, landline_nums, scope, site, office, location]);

    const saveFunction = () => {
        const mobile_numbers = removeNumberMask(mobile_nums, "mobile");
        const landline_numbers = removeNumberMask(landline_nums, "landline");
        const ewi_recipient = is_ewi_recipient ? 1 : 0;
        const active = is_active ? 1 : 0;
        const final_data = {
            user: {
                ...user_details,
                emails,
                ewi_recipient,
                restriction,
                active
            },
            affiliation: {
                site,
                location,
                scope,
                office
            },
            contact_numbers: {
                mobile_numbers,
                landline_numbers
            }
        };
        
        saveContact(final_data, data => {
            const { status, message } = data;
            if (status === true) {
                closeButtonFn();
                sendWSMessage("update_all_contacts");
                enqueueSnackbar(
                    message,
                    {
                        variant: "success",
                        autoHideDuration: 3000,
                        action: snackBarActionFn
                    }
                );
                enqueueSnackbar(
                    "Updating contact list...",
                    {
                        variant: "warning",
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
        <Grid
            container 
            spacing={1} 
            alignItems="center"
            justify="space-evenly"
        >
            <Grid item xs={2} style={{ textAlign: "-webkit-center" }}>
                <Avatar>
                    <Person />
                </Avatar>
            </Grid>

            <Grid item xs={9}>
                <Typography variant="h5" align="center">
                    Contact Form
                </Typography>
            </Grid>

           
            <Grid item xs={1} >
                <IconButton edge="start" onClick={closeButtonFn}>
                    <Close />
                </IconButton>
            </Grid>


            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Personal Details
                </Typography>
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="First Name"
                    value={user_details.first_name}
                    onChange={nameChangeHandler("first_name")}
                    margin="dense"
                    required
                    error={user_details.first_name === ""}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Last Name"
                    value={user_details.last_name}
                    onChange={nameChangeHandler("last_name")}
                    margin="dense"
                    required
                    error={user_details.last_name === ""}
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Middle Name"
                    value={user_details.middle_name}
                    onChange={nameChangeHandler("middle_name")}
                    margin="dense"
                />
            </Grid>

            <Grid item xs={6}>
                <TextField
                    label="Nickname"
                    value={user_details.nickname}
                    onChange={nameChangeHandler("nickname")}
                    margin="dense"
                />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Affiliation
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <SelectInputForm
                    div_id="scope"
                    label="Scope"
                    changeHandler={event => setScope(event.target.value)}
                    value={scope}
                    list={scope_list}
                    mapping={{ id: "id", label: "label" }}
                    required
                    error={scope === ""}
                />
            </Grid>

            {
                [0, 1].includes(scope) && (
                    <Grid item xs={6}>
                        <DynaslopeSiteSelectInputForm
                            value={site}
                            changeHandler={value => setSite(value)}
                            // renderDropdownIndicator={false}
                        />
                    </Grid>
                )
            }

            {
                [2, 3, 4].includes(scope) && (
                    <Grid item xs={6}>
                        <SelectInputForm
                            div_id="location"
                            label={scope_list[scope].select_label}
                            changeHandler={event => setLocation(event.target.value)}
                            value={location}
                            list={scope_list[scope].list}
                            mapping={{ id: "id", label: "label" }}
                            required
                            error={location === ""}
                        />
                    </Grid>
                )
            }

            <Grid item xs={6}>
                <SelectInputForm
                    div_id="office"
                    label="Office"
                    changeHandler={event => setOffice(event.target.value)}
                    value={office}
                    list={offices}
                    mapping={{ id: "id", label: "label" }}
                    required
                    error={office === ""}
                />
            </Grid>

            <Grid item xs={6} style={{ textAlign: "center" }}>
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={is_active}
                                onChange={isActiveHandler}
                                value="checkedA"
                                color="primary"
                            />
                        }
                        label="Active"
                    />
                </FormControl>
            </Grid>
            
            <Grid item xs={6} style={{ textAlign: "center" }}>
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={is_ewi_recipient}
                                onChange={ewiRecipientHandler}
                                value="checkedB"
                                color="primary"
                            />
                        }
                        label="EWI Recipient"
                    />
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <SelectInputForm
                    div_id="ewi_restriction"
                    label="Ewi Restriction"
                    changeHandler={event => setRestriction(event.target.value)}
                    value={restriction}
                    list={restriction_list}
                    mapping={{ id: "id", label: "label" }}
                    required
                    error={restriction === ""}
                />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Contact Information
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    Mobile
                </Typography>
            </Grid>

            {
                mobile_nums.map((row, index) => {
                    const { sim_num, status, has_delete } = row;
                    const enable_delete = typeof has_delete !== "undefined";
                    let is_sim_num_invalid = true;
                    if (sim_num === "") {
                        is_sim_num_invalid = true;
                    } else {
                        is_sim_num_invalid = sim_num.includes("x");
                    }
                    return (
                        <Fragment key={index}>
                            <Grid item xs={7}>
                                <FormControl fullWidth>
                                    <TextField
                                        // className={classes.formControl}
                                        label="Mobile Number"
                                        value={sim_num}
                                        onChange={event => setMobileNums({
                                            type: "UPDATE",
                                            payload: {
                                                data: "sim_num",
                                                value: event.target.value,
                                                key: index
                                            },
                                            category: "mobile"
                                        })}
                                        id="formatted-numberformat-input"
                                        InputProps={{
                                            inputComponent: TextMaskCustom,
                                            inputProps: { mask: mobile_number_mask }
                                        }}
                                        required
                                        error={is_sim_num_invalid}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={3} style={{ textAlign: "center" }}>
                                <FormControlLabel
                                    style={{ margin: 0 }}
                                    control={
                                        <Checkbox
                                            checked={Boolean(status)}
                                            onChange={event => setMobileNums({
                                                type: "UPDATE",
                                                payload: {
                                                    data: "status",
                                                    value: event.target.checked ? 1 : 0,
                                                    key: index
                                                },
                                                category: "mobile"
                                            })}
                                            // value="checkedB"
                                            color="primary"
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>
                            {
                                index !== 0 && enable_delete ? (
                                    <Grid item xs={2} style={{ textAlign: "center" }}>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            aria-label="delete"
                                            onClick={() => setMobileNums({
                                                type: "DELETE",
                                                payload: { key: index }
                                            })}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                ) : (
                                    <Hidden>
                                        <Grid item xs={2} />
                                    </Hidden>
                                )
                            }
                            
                        </Fragment>
                    );
                })
            }

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddCircle />}
                    onClick={() => setMobileNums({ type: "ADD", category: "mobile" })}
                >
                    Add number
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    Landline
                </Typography>
            </Grid>

            {
                landline_nums.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" align="center" paragraph>
                            No landline number saved
                        </Typography>
                    </Grid>
                )
            }

            {
                landline_nums.map((row, index) => {
                    const { landline_num } = row;
                    let is_landline_valid = true;
                    if (landline_num === "" ) {
                        is_landline_valid = true;
                    } else {
                        is_landline_valid = landline_num.includes("x");
                    }
                    return (
                        <Fragment key={index}>
                            <Grid item xs={10}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Landline Number"
                                        value={landline_num}
                                        onChange={event => setLandlineNums({
                                            type: "UPDATE",
                                            payload: {
                                                data: "landline_num",
                                                value: event.target.value,
                                                key: index
                                            },
                                            category: "landline"
                                        })}
                                        id="formatted-numberformat-input"
                                        InputProps={{
                                            inputComponent: TextMaskCustom,
                                            inputProps: { mask: [/\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/] }
                                            // startAdornment: <InputAdornment position="start">(+639)</InputAdornment>
                                        }}
                                        required
                                        error={is_landline_valid}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid item xs={2} style={{ textAlign: "center" }}>
                                <IconButton
                                    edge="end"
                                    size="small"
                                    aria-label="delete"
                                    onClick={() => setLandlineNums({
                                        type: "DELETE",
                                        payload: { key: index }
                                    })}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                                
                        </Fragment>
                    );
                })
            }

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddCircle />}
                    onClick={() => setLandlineNums({ type: "ADD", category: "landline" })}
                >
                    Add number
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    Email
                </Typography>
            </Grid>

            {
                emails.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" align="center" paragraph>
                            No email address saved
                        </Typography>
                    </Grid>
                )
            }

            {
                emails.map((email, index) => {
                    return (
                        <Fragment key={index}>
                            <Grid item xs={10}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Email"
                                        value={email.email}
                                        onChange={event => setEmails({
                                            type: "UPDATE",
                                            payload: {
                                                value: event.target.value,
                                                key: index
                                            },
                                            category: "email"
                                        })}
                                        id="formatted-numberformat-input"
                                    />
                                </FormControl>
                            </Grid>

                            <Grid item xs={2} style={{ textAlign: "center" }}>
                                <IconButton
                                    edge="end"
                                    size="small"
                                    aria-label="delete"
                                    onClick={() => setEmails({
                                        type: "DELETE",
                                        payload: { key: index }
                                    })}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Fragment>
                    );
                })
            }

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddCircle />}
                    onClick={() => setEmails({ type: "ADD", category: "email" })}
                >
                    Add email
                </Button>
            </Grid>

            <Grid item xs={12} style={{ padding: "16px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    color="secondary" 
                    variant="contained"
                    style={{ marginRight: 6 }} 
                    onClick={() => saveFunction()}
                    disabled={save_button_state}
                >
                    Save
                </Button>
                <Button variant="contained" onClick={() => setContactFormForEdit(false)}>
                    Cancel
                </Button>
            </Grid>
        </Grid>
    );
}

export default React.memo(ContactForm);