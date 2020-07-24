import MomentUtils from "@date-io/moment";
import moment from "moment";
import React, { useState, useEffect, useContext } from "react";
import { Avatar, TextField, OutlinedInput, Tooltip,
    Button, IconButton, InputAdornment, Divider
} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import MaskedInput from "react-text-mask";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
} from "@material-ui/pickers";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcCallIcon from "@material-ui/icons/AddIcCall";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import { Redirect } from "react-router-dom";
import { CreateDynaMember } from "./ajax";
import { react_host } from "../../config";
import { GeneralContext } from "../contexts/GeneralContext";
import { getCurrentUser } from "../sessions/auth";

const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.primary.main,
        padding: 5,
    },
    successIcon: {
        margin: theme.spacing(1),
        width: 70,
        height: 70,
        color: "green",
        backgroundColor: "white",
    },
    form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing(3),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    hide: {
        display: "none",
    },
    flex: {
        display: "flex",
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

const salutations = [
    {
        value: "Mr.",
        label: "Mr.",
    },
    {
        value: "Ms.",
        label: "Ms.",
    },
    {
        value: "Mrs.",
        label: "Mrs.",
    },
];
  
export default function CreateDynaUser () {
    const classes = useStyles();
    const { setRefreshUser } = useContext(GeneralContext);
    const mobile_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEemail] = useState([]);
    const [typedEmail, setTypedemail] = useState("");
    const [mobileNumber, setMobileNumber] = useState([]);
    const [typedMobile, setTypedMobile] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSuccess, setSuccess] = useState(false);
    const [birthday, setBirthday] = useState(null);
    const [sex, setGender] = useState("m");
    const [salutation, setSalutation] = useState("Mr.");
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        if (username !== "" && password !== "") {
            setDisabled(false);
        } else {
            setDisabled(true);
        }
    }, [username, password]);
    const handleSubmit = () => {
        const unmasked_number = mobileNumber.map(row => {
            return row.replace(/[()+-\s]/g, "");
        });
        const number = [];
        unmasked_number.forEach(sim => {
            const formatted = {
                mobile_number: {
                    mobile_id: 0,
                    sim_num: sim                 
                },
                status: 1
            };
            number.push(formatted);
        });
        
        const json_data = {
            user_id: 0,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            nickname,
            salutation,
            birthday,
            sex,
            emails: email,
            mobile_numbers: unmasked_number !== "" ? number : [],
            landline_numbers: [],
            ewi_recipient: 0,
            status: 1,
            username,
            password
        };
        CreateDynaMember(json_data, response => {
            if (response.status) {
                setSuccess(true);
                setRefreshUser(true);
            }
        });
    };

    const reset = () => {
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setNickname("");
        setGender("");
        setBirthday(null);
        setSalutation("");

        setUsername("");
        setPassword("");
        setEemail([]);
        setMobileNumber([]);

        setDisabled(true);
        setSuccess(false);
    };

    const goHome = () => {
        window.location.href = react_host;
    };
    
    const getBirthday = date => {
        const bday = moment(date).format("yyy-MM-DD");
        setBirthday(bday);
    };

    const insertToEmail = () => {
        if (typedEmail.length > 0) {
            const emails = email;
            emails.push(typedEmail);
            setEemail([...emails]);
            setTypedemail("");
        }
    };

    const removeFromEmailList = index => {
        const emails = email;
        emails.splice(index, 1);
        setEemail([...emails]);
    };

    const insertToMobileNumbers = () => {
        if (typedMobile.length > 0) {
            const mobiles = mobileNumber;
            mobiles.push(typedMobile);
            setMobileNumber([...mobiles]);
            setTypedMobile("");
        }
    };

    const removeFromMobileList = index => {
        const mobiles = mobileNumber;
        mobiles.splice(index, 1);
        setMobileNumber([...mobiles]);
    };
    return (
        <Container component="main" maxWidth="xs">
            <div className={classes.paper}>
                <Avatar className={isSuccess ? classes.successIcon : classes.avatar}>
                    {isSuccess ? <CheckCircleOutlineIcon className={classes.successIcon}/> : <PersonAddIcon /> }
                </Avatar>                   
                <Typography component="h1" variant="h5">
                    {isSuccess ? "New user was created!" : " Create Dynaslope User"}
                </Typography>
                <div className={isSuccess ? classes.hide : classes.form} >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                variant="outlined"
                                value={salutation}
                                fullWidth
                                select
                                onChange={e=> setSalutation(e.target.value)}
                                SelectProps={{
                                    "native": true,
                                }}
                            >
                                {salutations.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                variant="outlined"
                                value={firstName}
                                label="First Name"
                                fullWidth
                                onChange={e=> setFirstName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                variant="outlined"
                                value={middleName}
                                label="Middle Name"
                                fullWidth
                                onChange={e=> setMiddleName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                variant="outlined"
                                value={lastName}
                                label="Last Name"
                                fullWidth
                                onChange={e=> setLastName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                variant="outlined"
                                value={nickname}
                                fullWidth
                                label="Nickame"
                                onChange={e=> setNickname(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                variant="outlined"
                                value={sex}
                                fullWidth
                                select
                                onChange={e=> setGender(e.target.value)}
                                SelectProps={{
                                    "native": true,
                                }}
                            >
                                <option value="m">
                                    Male
                                </option>
                                <option value="f">
                                    Female
                                </option>                           
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <MuiPickersUtilsProvider utils={MomentUtils}>
                                <KeyboardDatePicker
                                    disableToolbar
                                    variant="dialog"
                                    format="yyyy-MM-DD"
                                    margin="normal"
                                    label="Birth Date"
                                    value={birthday}
                                    onChange={e=>getBirthday(e)}
                                    KeyboardButtonProps={{
                                        "aria-label": "change date",
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    fullWidth
                                    style={{ marginTop: 0 }}
                                    disableFuture
                                    maxDate={moment().subtract(15, "years")}
                                />
                            </MuiPickersUtilsProvider>
                        </Grid>
                        { mobileNumber.length > 0 && (
                            mobileNumber.map((row, index) => {
                                return (
                                    <Grid item xs={12} key={row} className={classes.flex}>
                                        <TextField
                                            variant="outlined"
                                            value={row}
                                            fullWidth
                                            label="Phone"
                                            InputProps={{
                                                inputComponent: TextMaskCustom,
                                                inputProps: { mask: mobile_number_mask }
                                            }}
                                        />
                                        <Tooltip title="remove from list" >
                                            <IconButton  
                                                variant="contained"
                                                style={{ margin: 2, color: "red" }}
                                                onClick={e=> removeFromMobileList(index)}
                                            >
                                                <RemoveCircleOutlineIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </Grid>
                                );
                            })
                        )
                        }
                        <Grid item xs={12} className={classes.flex}>
                            <TextField
                                variant="outlined"
                                value={typedMobile}
                                fullWidth
                                onChange={e=> setTypedMobile(e.target.value)}
                                placeholder="Mobile Number"
                                InputProps={{
                                    inputComponent: TextMaskCustom,
                                    inputProps: { mask: mobile_number_mask }
                                }}
                            />
                            <Tooltip title="add to list">
                                <IconButton 
                                    color="primary" 
                                    variant="contained"
                                    style={{ margin: 2 }}
                                    onClick={e=> insertToMobileNumbers()}
                                >
                                    <AddIcCallIcon/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Divider/>      
                        { 
                            email.length > 0 
                             && (
                                 email.map( (row, index) => {
                                     return (
                                         <Grid item xs={12} key={row}>
                                             <OutlinedInput
                                                 fullWidth
                                                 value={row}
                                                 onChange={e=> setTypedemail(e.target.value)}
                                                 endAdornment=
                                                     {
                                                         <InputAdornment position="end">
                                                             <Tooltip title="Remove email from list">
                                                                 <IconButton onClick={e=> removeFromEmailList(index)}>
                                                                     <DeleteIcon/>
                                                                 </IconButton>
                                                             </Tooltip>
                                                         </InputAdornment>
                                                     }
                                             />
                                         </Grid>
                                     );
                                 }
                                 ))
                        }
                        <Grid item xs={12}>
                            <OutlinedInput
                                fullWidth
                                placeholder={email.length > 0 ? "Add another email" : "Email"}
                                value={typedEmail}
                                onChange={e=> setTypedemail(e.target.value)}
                                endAdornment=
                                    {
                                        <InputAdornment position="end">
                                            <Tooltip title="add email to list">
                                                <IconButton
                                                    color="primary" 
                                                    onClick={e=> insertToEmail()}
                                                    
                                                >
                                                    <AddIcon/>
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>       
                                    }
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                variant="outlined"
                                value={username}
                                fullWidth
                                label="username"
                                type="text"
                                onChange={e=> setUsername(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                variant="outlined"
                                value={password}
                                fullWidth
                                label="Password"
                                type="password"
                                onChange={e=> setPassword(e.target.value)}
                            />
                        </Grid>
                    </Grid>             
                </div>
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                    onClick={isSuccess ? e=>goHome() : e=>handleSubmit()}
                    disabled={isSuccess ? false : disabled}
                >
                    {isSuccess ? "Dashboard" : "Create"}
                </Button>
                { isSuccess && (
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={e=>reset()}
                    >
                        Create another account
                    </Button>
                )}
            </div>
        </Container>
    );
}