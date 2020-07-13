import React, { useState, useEffect } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { InputAdornment, IconButton } from "@material-ui/core";
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser";
import { getCurrentUser } from "../sessions/auth";
import { updateUserCredentials } from "./ajax";
import { react_host } from "../../config";

const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    avatar_success: {
        margin: theme.spacing(1),
        backgroundColor: "green",
    },
    form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    form_display: {
        display: "block",
    },
    form_hide: {
        display: "none",
    }
}));

export default function ChangePassword (props) {
    const classes = useStyles();
    const [warningText, setWarningText] = useState("");
    const [username, setUsername] = useState("");
    const [pass1, setPass1] = useState("");
    const [pass2, setPass2] = useState("");
    const [old_pass, setOldPass] = useState("");
    const [disabled, setDisabled] = useState(true);
    const [show, setShow] = useState(false);
    const [color, setColor] = useState("error");
    const [title, setTitle] = useState("Update login credentials");
    const [success, setSuccess] = useState(false);
    const { user_id } = getCurrentUser();

    useEffect(() => {
        if (pass1.length > 5 || pass2.length > 5) {
            if (pass1 === pass2) {
                setWarningText("Enter your old password below"); 
                setDisabled(false);
                setColor("primary");
            }
            else {
                setWarningText("password did not matched");
                setDisabled(true);
                setColor("error");
            } 
        } else {
            setWarningText("password too short!!");
            setColor("error");
        }
        if (pass1.length === 0 || pass2.length === 0) {
            setWarningText("");
        }
    }, [pass1, pass2]);

    const handleClickShowPassword = () => {
        !show ? setShow(true) : setShow(false);
    };

    const saveChanges = () => {
        const data = {
            user_id,
            username,
            new_password: pass1,
            old_password: old_pass,
        };
        updateUserCredentials(data, response => {
            if (response === "success") {
                setTitle("Account update success");
                setSuccess(true);
            } else {
                setTitle("Invalid old password");
                setSuccess(false);
            }
        });
    };

    const goToProfile = () => {
        window.location.href = `${react_host}/profile`;
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={ !success ? classes.avatar : classes.avatar_success}>
                    {success ? <VerifiedUserIcon/> : <LockOutlinedIcon />}
                </Avatar>
                <Typography 
                    component="h1" 
                    variant="h5"
                >
                    {title}
                </Typography>
                <div className={ success ? classes.form_hide : classes.form_display}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="New username (leave empty if no changes)"
                        name="Username"
                        onChange={e=> setUsername(e.target.value)}           
                    />
                    
                    <TextField
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type={show ? "text" : "password"}
                        label="New password"
                        id="password1"
                        onChange={e=> setPass1(e.target.value)}
                    />

                    <TextField
                        variant="outlined"
                        margin="normal"
                        type={show ? "text" : "password"}
                        fullWidth
                        id="password2"
                        label="Confirm new password"
                        onChange={e=> setPass2(e.target.value)}
                        InputProps={{ endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                >
                                    {show ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                        }}
                    />

                    <Typography variant="body2" color={color}> 
                        {warningText}
                    </Typography>

                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="currentpassword"
                        label="Current password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        disabled={disabled}
                        onChange={e => setOldPass(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                    disabled={disabled}
                    onClick={ success ? goToProfile : saveChanges}
                >
                    {success ? "go to profile" : "save changes"}
                </Button>
            </div>       
        </Container>
    );
}