import React, {
    useState, useEffect, useReducer, Fragment
} from "react";

import {
    Button, Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, ListItemSecondaryAction, IconButton,
    Avatar, TextField, Hidden,
    ListItemIcon, Chip,
    Paper, Divider, Slide,
    Backdrop, Tooltip, AppBar,
    Toolbar, Dialog, FormControlLabel, Checkbox,
    FormControl, FormLabel, RadioGroup,
    Radio
} from "@material-ui/core";
import { 
    Create, Search,
    Folder as FolderIcon, Delete as DeleteIcon,
    Close, Call, Person, PersonAdd,
    Block, AddCircle
} from "@material-ui/icons";

import MaskedInput from "react-text-mask";

import SelectInputForm from "../../reusables/SelectInputForm";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

const offices_obj = {
    "0": ["LEWC"],
    "1": ["LGU", "NGO"],
    "2": ["LGU", "NGO", "PNP"],
    "3": ["LGU", "NGO", "PNP"],
    "4": ["NGO", "OCD", "PHIVOLCS", "DOST"],
    "5": ["NGO", "OCD", "PHIVOLCS", "DOST", "MGB"]
};

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

function removeNumberMask (data, type) {
    let altered_data = [];
    if(type == "mobile"){
        data.map((row, index) => {
            row.sim_num = row.sim_num.replace(/[\(\)+-\s]/g, "");
            altered_data.push(row)
        });
    }else{
        data.map((row, index) => {
            row.landline_num = row.landline_num.replace(/[\(\)+-\s]/g, "");
            altered_data.push(row)
        })
    }

    return altered_data
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
        setContactFormForEdit
    } = props;

    let initial_mobiles = [{
        mobile_id: 0, sim_num: "", status: 1
    }];
    let initial_landlines = [];
    let initial_emails = [];
    let initial_user_details = {
        first_name: "", last_name: "",
        middle_name: "", nickname: "", user_id: 0
    };

    if (isEditMode) {
        const { mobile_numbers, user: {
            landline_numbers, emails, first_name,
            last_name, middle_name, nickname, user_id
        } } = chosenContact;
        initial_user_details = { first_name, last_name, middle_name, nickname, user_id };
        console.log(mobile_numbers)
        initial_mobiles = mobile_numbers;
        initial_landlines = landline_numbers;
        initial_emails = emails;
    }

    const scope_list = [
        { id: 0, label: "Community" },
        { id: 1, label: "Barangay" },
        { id: 2, label: "Municipal", select_label: "Municipality", list: municipalities },
        { id: 3, label: "Provincial", select_label: "Province", list: provinces },
        { id: 4, label: "Regional", select_label: "Region", list: regions },
        { id: 5, label: "National" }
    ];
    const [user_details, setUserDetails] = useState(initial_user_details);
    const [scope, setScope] = useState(0);
    const [site, setSite] = useState("");
    const [location, setLocation] = useState("");
    const [offices, setOffices] = useState([]);
    const [office, setOffice] = useState("");
    const [mobile_nums, setMobileNums] = useReducer(reducerFunction, initial_mobiles);
    const [landline_nums, setLandlineNums] = useReducer(reducerFunction, initial_landlines);
    const [emails, setEmails] = useReducer(reducerFunction, initial_emails);

    const closeButtonFn = () => {
        if (isEditMode) return setContactFormForEdit(false);
        return setContactForm(false);
    };

    const nameChangeHandler = attr => event => {
        setUserDetails({ ...user_details, [attr]: event.target.value });
    };

    useEffect(() => {
        setLocation("");

        let office_list = [];
        if (scope !== "") {
            office_list = offices_obj[scope];
            const o = office_list.map(x => ({ id: x.toLowerCase(), label: x }));
            setOffices(o);
        }
        setOffice("");
    }, [scope]);

    const [final_obj, setFinalObj] = useState({});

    useEffect(() => {
        setFinalObj({
            user: {
                ...user_details
            }
        });
    }, [user_details]);

    const saveFunction = () => {
        let mobile_numbers = removeNumberMask(mobile_nums, "mobile");
        let landline_numbers = removeNumberMask(landline_nums, "landline");
        const final_obj = {
            user: {
                ...user_details,
                emails
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
        }
        console.log(final_obj)
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
                    error
                    required
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
                            error
                            required
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
                    error
                    required
                />
            </Grid>
            
            <Grid item xs={12} style={{ textAlign: "center" }}>
                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                // checked={state.checkedB}
                                // onChange={handleChange("checkedB")}
                                value="checkedB"
                                color="primary"
                            />
                        }
                        label="EWI Recipient"
                    />
                </FormControl>
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
                                            inputProps: { mask: ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/] }
                                        }}
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
                <Button color="secondary" variant="contained" style={{ marginRight: 6 }} onClick={() => saveFunction()}>
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