import React, {
    useState, useContext,
    Fragment, useReducer
} from "react";
import { Link } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import {
    Avatar, Grid, Badge, IconButton,
    ListItemText, List, ListItem, 
    ListItemIcon, CardContent, CardMedia,
    Button, Dialog, TextField,
    Select, MenuItem, Divider,
    Checkbox, Typography, ListItemAvatar,
    DialogTitle, FormControl, InputLabel,
    FormControlLabel
} from "@material-ui/core";

import {
    Lock as LockIcon,
    PhoneAndroid, MailOutline,
    Delete, AddCircle,
    Wc as WcIcon,
    Cake, Edit as EditIcon
} from "@material-ui/icons";

import StringMask from "string-mask";
import MaskedInput, { conformToMask } from "react-text-mask";
import moment from "moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import { cloneDeep } from "lodash";
import { useSnackbar } from "notistack";

// import MyShifts from "./UserShift";
import { updateUserInfo } from "./ajax";
import Dyna_Wall from "../../images/dyna_wall.jpg";
import { GeneralContext } from "../contexts/GeneralContext";
import GenericAvatar from "../../images/generic-user-icon.jpg";
import MonitoringShiftsCalendar from "../widgets/monitoring_shifts/MonitoringShiftsCalendar";

const useStyles = makeStyles(theme => ({
    root: {
        maxWidth: "100%",
        flexGrow: 1,
    },
    container: {
        maxWidth: "50%",
    },
    media: {
        objectPosition: "top"
    },
    avatar: {
        width: 150,
        height: 150,
        [theme.breakpoints.down("md")]: {
            width: 100,
            height: 100,
        },
        backgroundColor: "#f2f2f2"
    },
    avatarContainer: {
        marginTop: -72,
        marginBottom: theme.spacing(1)
    },
    editButton: {
        backgroundColor: "#f2f2f2",
        "&:hover": {
            backgroundColor: "#f2f2f2",
        }
    },
    nickname: { marginBottom: theme.spacing(2) },
    listBody: { 
        paddingLeft: theme.spacing(7),
        paddingRight: theme.spacing(11),
        textAlign: "center"
    },
    link: {
        textDecoration: "none",
        color: "black"
    },
    alignCenter: {
        textAlign: "center",
    },
    alignRight: {
        textAlign: "right"
    }
}));

function TextMaskCustom (props) {
    const { inputRef, mask, ...other } = props;
    return (
        <MaskedInput
            {...other}
            ref={ref => {
                inputRef(ref ? ref.inputElement : null);
            }}
            mask={mask} placeholderChar="&times;"
            showMask
        />
    );
}

const mobile_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
const conforming_mobile_mask = ["(", "+", /\d/, /\d/, /\d/, ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];

function sanitizeData (state) {
    const clean_data = {};
    const data = cloneDeep(state);
    delete data.field_with_error;
    Object.keys(data).forEach(key => {
        let clean_value = null;

        if (key === "mobile_numbers") {
            clean_value = data[key].map(x => {
                const { mobile_number, status } = x;
                return {
                    ...x,
                    status: status.value,
                    mobile_number: {
                        ...mobile_number,
                        sim_num: mobile_number.sim_num.value
                    }
                };
            });
        } else if (key === "emails") {
            clean_value = data[key].map(x => ({
                ...x,
                email: x.email.value
            }));
        } else if (key === "birthday") {
            const { value } = data[key];
            clean_value = typeof value === "string" ? value : value.format("YYYY-MM-DD");
        } else {
            clean_value = data[key].value;
        }

        clean_data[key] = clean_value;
    });

    return clean_data;
}

function getHelperText (field, value, is_required) {
    if (value === "" && is_required) return "Required field";

    if (field === "sim_num") {
        if (!value.match(/^[a-z0-9]+$/i)) return "Enter complete mobile number";
    }

    if (field === "birthday") {
        if (value !== null && !value.isValid()) return "Enter a valid date";
    }

    return "";
}

function reducerFunction (state, action) {
    const { type, field, value, key, category } = action;

    let field_value = null;
    let new_value = null;
    let new_helper_text = null;
    let arr = null;
    const { field_with_error } = state;

    if (type === "ADD") {
        let new_instance = {};

        if (category === "mobile_numbers") {
            arr = [...state.mobile_numbers];
            new_instance = initMobileNumbers({
                status: 1,
                mobile_number: {
                    sim_num: "",
                    mobile_id: 0
                }
            });
        } else if (category === "emails") {
            arr = [...state.emails];
            new_instance = initEmails({
                email: "",
                email_id: 0
            });
        }

        arr.push(new_instance);
        field_with_error.add(`${category}.${arr.length - 1}`);
    } else if (type === "DELETE") {
        if (category === "mobile_numbers")
            arr = [...state.mobile_numbers];
        else if (category === "emails")
            arr = [...state.emails];
        
        arr.splice(key, 1);
        const temp = field_with_error;
        temp.forEach(x => {
            if (x.includes(`${category}.${key}`)) {
                field_with_error.delete(x);
            }
        });
    } else {
        field_value = state[field];
        let unfilled_key_str = field;
    
        new_value = value;
        if (["middle_name", "sex"].includes(field)) new_value = value || null;
        if (field === "sim_num") new_value = value.replace(/[()+-\s]/g, "");

        if (typeof category === "undefined") {
            new_helper_text = getHelperText(field, new_value, field_value.required);
        }

        arr = [];
        if (["status", "sim_num"].includes(field)) {
            arr = [...state.mobile_numbers];
            let saving_point = {};
            if (field === "status") {
                field_value = arr[key][field];
                saving_point = arr[key];
            } else {
                const parent_val = arr[key].mobile_number;
                field_value = parent_val[field];
                saving_point = arr[key].mobile_number;
            }

            new_helper_text = getHelperText(field, new_value, field_value.required);
            const new_field_value = {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            };

            saving_point[field] = new_field_value;
            unfilled_key_str = `mobile_numbers.${key}`;
        }

        if (field === "email") {
            arr = [...state.emails];
            const obj = arr[key];
            field_value = obj[field];

            new_helper_text = getHelperText(field, new_value, field_value.required);
            const new_field_value = {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            };

            obj[field] = new_field_value;
            unfilled_key_str = `emails.${key}`;
        }

        if (typeof category !== "undefined") {
            if (field_with_error.has(unfilled_key_str)) {
                field_with_error.delete(unfilled_key_str);
            }

            unfilled_key_str += `.${field}`;
        }

        if (new_helper_text) {
            field_with_error.add(unfilled_key_str);
        } else {
            field_with_error.delete(unfilled_key_str);
        }
    }

    switch (type) {
        case "UPDATE":
            return {
                ...state,
                [field]: {
                    ...field_value,
                    value: new_value,
                    helper_text: new_helper_text
                },
                field_with_error
            };
        case "UPDATE_MOBILE":
            return {
                ...state, 
                mobile_numbers: arr,
                field_with_error
            };
        case "UPDATE_EMAIL":
            return {
                ...state, 
                emails: arr,
                field_with_error
            };
        case "ADD":
            return {
                ...state,
                [category]: arr,
                field_with_error
            };
        case "DELETE":
            return {
                ...state,
                [category]: arr,
                field_with_error
            };
        default:
            return { ...state };
    }
}

function initEmails (x) {
    return {
        ...x,
        email: {
            value: x.email,
            helper_text: null,
            required: true
        }
    };
}

function initMobileNumbers (x) {
    const { mobile_number } = x;
    return {
        ...x,
        status: {
            value: x.status,
            helper_text: null,
            required: false,
        },
        mobile_number: {
            ...mobile_number,
            sim_num: {
                value: mobile_number.sim_num,
                helper_text: null,
                required: true
            }
        }
    };
}

function initReducer (data) {
    const new_data = {};
    const not_required = ["middle_name", "sex", "birthday"];
    Object.keys(data).forEach(key => {
        let value = {
            value: data[key],
            helper_text: null,
            required: !not_required.includes(key)
        };

        if (key === "mobile_numbers") {
            value = data[key].map(x => initMobileNumbers(x));
        }

        if (key === "emails") {
            value = data[key].map(x => initEmails(x));
        }

        new_data[key] = value;
    });

    new_data.field_with_error = new Set();

    return new_data;
}

function conformTextMask (sim_num) {
    const { conformedValue } = conformToMask(sim_num, conforming_mobile_mask);
    return conformedValue;
}

function ProfileEdit (props) {
    const { classes, selectedUserDetails, setIsEdit } = props;
    const [user_data, dispatch] = useReducer(reducerFunction, selectedUserDetails, initReducer);
    const { setRefreshUser } = useContext(GeneralContext);
    const { enqueueSnackbar } = useSnackbar();
    
    const save_data = () => {
        const final_data = sanitizeData(user_data);
        console.log("Final", final_data);

        updateUserInfo(final_data, data => {
            const { status, message } = data;

            enqueueSnackbar(
                message,
                {
                    variant: status,
                    autoHideDuration: 5000
                }
            );

            if (status === "success") {
                setIsEdit(false);
                setRefreshUser(true);
            }
        });
    };

    return (
        <Fragment>
            <Grid item xs={12} container spacing={2} style={{ marginTop: 8 }}>
                <Grid item xs={6} sm={3}>
                    <TextField
                        label="First Name"
                        required
                        value={user_data.first_name.value || ""}
                        onChange={e => dispatch({ type: "UPDATE", field: "first_name", value: e.target.value })}
                        helperText={user_data.first_name.helper_text || ""}
                        error={Boolean(user_data.first_name.helper_text)}
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <TextField
                        label="Last Name"
                        required
                        value={user_data.last_name.value || ""}
                        onChange={e => dispatch({ type: "UPDATE", field: "last_name", value: e.target.value })}
                        helperText={user_data.last_name.helper_text || ""}
                        error={Boolean(user_data.last_name.helper_text)}
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <TextField
                        label="Middle Name"
                        value={user_data.middle_name.value || ""}
                        onChange={e => dispatch({ type: "UPDATE", field: "middle_name", value: e.target.value })}
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <TextField
                        label="Nickname"
                        required
                        value={user_data.nickname.value || ""}
                        onChange={e => dispatch({ type: "UPDATE", field: "nickname", value: e.target.value })}
                        helperText={user_data.nickname.helper_text || ""}
                        error={Boolean(user_data.nickname.helper_text)}
                        disabled
                    />
                </Grid>

                <Grid item xs={6}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <KeyboardDatePicker
                            autoOk
                            label="Birthday"
                            value={user_data.birthday.value || null}
                            onChange={e => dispatch({ type: "UPDATE", field: "birthday", value: e })}
                            helperText={user_data.birthday.helper_text || ""}
                            error={Boolean(user_data.birthday.helper_text)}
                            ampm={false}
                            placeholder="01/01/2000"
                            format="MM/DD/YYYY"
                            mask="__/__/____"
                            clearable
                            disableFuture
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                
                <Grid item xs={6}>
                    <FormControl
                        fullWidth
                        // required 
                        // error={Boolean(user_data.sex.helper_text)}
                    >
                        <InputLabel id="sex-label">Sex</InputLabel>
                        <Select
                            labelId="sex-label"
                            id="sex-select"
                            value={user_data.sex.value || ""}
                            onChange={e => dispatch({ type: "UPDATE", field: "sex", value: e.target.value })}
                        >
                            <MenuItem value="">---</MenuItem>
                            <MenuItem value="M">Male</MenuItem>
                            <MenuItem value="F">Female</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12} lg={6} container spacing={1}>
                    <Typography
                        component={Grid} item xs={12}
                        variant="h6" align="center"
                    >
                        Contact Numbers
                    </Typography>

                    {
                        user_data.mobile_numbers.map((row, index) => {
                            const { mobile_number: { sim_num, mobile_id }, status } = row;
                            const is_existing = mobile_id !== 0; 

                            return (
                                <Grid item xs={12} container spacing={1} key={index}>
                                    <Grid item xs={7}>
                                        <FormControl fullWidth>
                                            <TextField
                                                label="Mobile Number"
                                                required
                                                value={conformTextMask(sim_num.value)}
                                                onChange={event => dispatch({
                                                    type: "UPDATE_MOBILE",
                                                    field: "sim_num",
                                                    value: event.target.value,
                                                    key: index,
                                                    category: "mobile_numbers"
                                                })}
                                                InputProps={{
                                                    inputComponent: TextMaskCustom,
                                                    inputProps: { mask: mobile_number_mask }
                                                }}
                                                helperText={sim_num.helper_text || ""}
                                                error={Boolean(sim_num.helper_text)}
                                            />
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={is_existing ? 5 : 3} container justify="center">
                                        <FormControlLabel
                                            style={{ margin: 0 }}
                                            control={
                                                <Checkbox
                                                    checked={Boolean(status.value)}
                                                    onChange={event => dispatch({
                                                        type: "UPDATE_MOBILE",
                                                        field: "status",
                                                        value: event.target.checked ? 1 : 0,
                                                        key: index,
                                                        category: "mobile_numbers"
                                                    })}
                                                    color="primary"
                                                />
                                            }
                                            label="Active"
                                        />
                                    </Grid>
                                    
                                    {
                                        !is_existing && (
                                            <Grid item xs={2} container justify="center">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    aria-label="delete"
                                                    onClick={() => dispatch({
                                                        type: "DELETE",
                                                        key: index,
                                                        category: "mobile_numbers"
                                                    })}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Grid>
                                        )
                                    }   
                                </Grid>
                            );
                        })
                    }

                    <Grid item xs={12} className={classes.alignRight}>
                        <Button 
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AddCircle />}
                            onClick={() => dispatch({ type: "ADD", category: "mobile_numbers" })}
                        >
                            Add number
                        </Button>
                    </Grid>
                </Grid>

                <Grid item xs={12} lg={6} container spacing={1}>
                    <Typography
                        component={Grid} item xs={12}
                        variant="h6" align="center"
                    >
                        Emails
                    </Typography>

                    {
                        user_data.emails.length === 0 && (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary" align="center" paragraph>
                                    No email address saved
                                </Typography>
                            </Grid>
                        )
                    }

                    {
                        user_data.emails.map((row, index) => {
                            const { email, email_id } = row;
                            const is_existing = email_id !== 0;

                            return (
                                <Grid item xs={12} container spacing={1} key={index}>
                                    <Grid item xs={is_existing ? 12 : 10}>
                                        <FormControl fullWidth>
                                            <TextField
                                                required
                                                label="Email Address"
                                                value={email.value}
                                                onChange={e => dispatch({
                                                    type: "UPDATE_EMAIL",
                                                    field: "email",
                                                    value: e.target.value,
                                                    key: index,
                                                    category: "emails"
                                                })}
                                                helperText={email.helper_text || ""}
                                                error={Boolean(email.helper_text)}
                                            />
                                        </FormControl>
                                    </Grid>

                                    {
                                        !is_existing && (
                                            <Grid item xs={2} container justify="center">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    aria-label="delete"
                                                    onClick={() => dispatch({
                                                        type: "DELETE",
                                                        key: index,
                                                        category: "emails"
                                                    })}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Grid>
                                        )
                                    }
                                </Grid>
                            );
                        })
                    }
                
                    <Grid item xs={12} className={classes.alignRight}>
                        <Button 
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AddCircle />}
                            onClick={() => dispatch({ type: "ADD", category: "emails" })}
                        >
                            Add email
                        </Button>
                    </Grid>
                </Grid>

                <Grid item xs={12} container justify="flex-end" style={{ marginTop: 8 }}>
                    <Button 
                        color="secondary" variant="contained"
                        style={{ marginRight: 6 }}
                        disabled={user_data.field_with_error.size > 0}
                        onClick={save_data}
                    >
                        Save
                    </Button>
                    <Button color="primary" variant="contained" onClick={() => setIsEdit(false)}>
                        Cancel
                    </Button>
                </Grid>
            </Grid>
        </Fragment>
    );
}

function ProfileDisplay (props) {
    const { classes, selectedUserDetails } = props;
    const {
        first_name, last_name, middle_name: m_name,
        nickname, birthday: bday, sex: t_sex,
        mobile_numbers, emails
    } = selectedUserDetails;

    const middle_name = ["", "NA", null].includes(m_name) ? "" : `${m_name}.`;
    const birthday = bday === null ? "---" : moment(bday).format("MMMM DD, YYYY");
    let sex = "---";
    if (t_sex !== null) sex = t_sex.toUpperCase() === "F" ? "Female" : "Male";

    const format_to_mask = (number => {
        if (!number.match(/[()+-\s]/g)) {
            const formatter = new StringMask("(+000) 00-000-0000");
            const result = formatter.apply(number);
            return result;
        }
        
        return number;
    });

    return (
        <Fragment>
            <Typography
                component={Grid} item xs={12}
                gutterBottom variant="h5"
            >
                {`${first_name} ${middle_name} ${last_name}`}
            </Typography>
            <Typography
                component={Grid} item xs={12}
                variant="body2" color="textSecondary"
                gutterBottom className={classes.nickname}
            >
                {nickname}
            </Typography>

            <Grid item xs={12} container style={{ marginBottom: 16 }}>
                <Grid item xs={12} sm={6} container justify="center" alignItems="center">
                    <Cake style={{ paddingRight: 8 }} />
                    <Typography variant="h6">{ birthday }</Typography>
                </Grid>
                            
                <Grid item xs={12} sm={6} container justify="center" alignItems="center">
                    <WcIcon style={{ paddingRight: 8 }} />
                    <Typography variant="h6">{ sex }</Typography>
                </Grid>
            </Grid>

            <Grid item xs={12} lg={6}>
                <Typography variant="h6">
                    Contact Numbers
                </Typography>

                <List dense>
                    {
                        mobile_numbers.length === 0 ? (
                            <ListItem className={classes.listBody}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PhoneAndroid />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="No mobile numbers saved"
                                />
                            </ListItem>
                        ) : (
                            mobile_numbers.map(num => (
                                <ListItem className={classes.listBody} key={num.mobile_number.mobile_id}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <PhoneAndroid />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={format_to_mask(num.mobile_number.sim_num)}
                                        secondary={`Status: ${num.status === 0 ? "Inactive" : "Active"}`}
                                    />
                                    {/* <ListItemSecondaryAction>
                                                    <ListItemText
                                                        secondary={`Status: ${num.status === 0 ? "Inactive" : "Active"}`}
                                                    />
                                                </ListItemSecondaryAction> */}
                                </ListItem>
                            ))
                        )
                    }
                </List>
            </Grid>

            <Grid item xs={12} lg={6}>
                <Typography variant="h6">
                    Emails
                </Typography>

                <List dense>
                    {
                        emails.length === 0 ? (
                            <ListItem className={classes.listBody}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <MailOutline />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="No email addresses saved"
                                />
                            </ListItem>
                        ) : (
                            emails.map(row => (
                                <ListItem className={classes.listBody} key={row.email_id}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <MailOutline />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={row.email}
                                    />
                                </ListItem>
                            ))
                        )
                    }
                </List>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6">
                    Monitoring Shifts
                </Typography>

                <MonitoringShiftsCalendar nickname={nickname} />
            </Grid>
        </Fragment>
    );
}

function ProfileDetails (props) {
    const { selectedUserDetails, isUser, url } = props;
    const classes = useStyles();
    const [isEdit, setIsEdit] = useState(false);
    const [open, setOpen] = useState(false);

    const handleEdit = () => {
        setIsEdit(true);
        setOpen(false);
    };

    const BadgeButton = () => {
        return (
            <Fragment>
                <IconButton
                    className={classes.editButton}
                    onClick={() => setOpen(true)}
                >
                    <EditIcon color="primary"/>
                </IconButton>

                <Dialog onClose={() => setOpen(false)} aria-labelledby="simple-dialog-title" open={open}>
                    <DialogTitle id="simple-dialog-title">Profile options</DialogTitle>
                    <List>
                        <ListItem button onClick={handleEdit}>
                            <ListItemIcon>
                                <EditIcon />
                            </ListItemIcon>
                            <ListItemText primary="Edit info" />
                        </ListItem>

                        <Link to={`${url}/credentials`} className={classes.link}>
                            <ListItem button>
                                <ListItemIcon>
                                    <LockIcon />
                                </ListItemIcon>
                                <ListItemText primary="Update credentials" />
                            </ListItem>
                        </Link>
                    </List>
                </Dialog>
            </Fragment>
        );
    };

    return (
        <Fragment>
            <CardMedia
                component="img"
                height="200"
                className={classes.media}
                image={Dyna_Wall}
                title="Dynaslope Header Pic"
            />

            <CardContent className={classes.alignCenter}>
                <Grid container justify="center">
                    <Grid 
                        container item xs={12} 
                        className={classes.avatarContainer}
                        justify="center"
                    >
                        <Badge
                            overlap="circle"
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            badgeContent={isUser && !isEdit && <BadgeButton/>}
                        >
                            <Avatar 
                                className={classes.avatar} 
                                src={GenericAvatar}
                            />
                        </Badge>
                    </Grid>

                    {
                        !isEdit ? (
                            <ProfileDisplay 
                                classes={classes}
                                selectedUserDetails={selectedUserDetails}
                            />
                        ) : (
                            <ProfileEdit
                                classes={classes}
                                selectedUserDetails={selectedUserDetails}
                                setIsEdit={setIsEdit}
                            />
                        )
                    }
                </Grid>
            </CardContent>
        </Fragment>
    );
}

export default ProfileDetails;
