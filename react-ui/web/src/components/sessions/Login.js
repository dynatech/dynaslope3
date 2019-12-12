import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { CircularProgress } from "@material-ui/core";
import { login } from "./auth";
import PhivolcsDynaslopeLogo from "../../images/phivolcs-dynaslope-logo.png";
import LoginBgImg from "../../images/login-bg-img.jpg";

function Copyright () {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {"Copyright © "}
            <Link color="inherit" href="https://material-ui.com/">
                Project Dynaslope
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        height: "100vh",
    },
    image: {
        backgroundImage: `url(${LoginBgImg})`,
        // backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
    },
    paperContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    paper: {
        margin: theme.spacing(0, 4),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: theme.spacing(5),
        [theme.breakpoints.up("lg")]: {
            paddingBottom: theme.spacing(9)
        }
    },
    phivolcsDynaslopeLogo: {
        margin: theme.spacing(1),
        height: 200,
        [theme.breakpoints.between("sm", "md")]: {
            height: 164
        },
        [theme.breakpoints.only("xs")]: {
            height: 140
        },
    },
    form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    title: {
        margin: theme.spacing(2, 0),
        [theme.breakpoints.down("sm")]: {
            fontSize: "1.25rem"
        },
        [theme.breakpoints.only("xs")]: {
            margin: theme.spacing(0, 0)
        }
    },
    passwordField: {
        margin: theme.spacing(0, 0, 3, 0),
        [theme.breakpoints.only("xs")]: {
            margin: theme.spacing(0, 0, 1, 0)
        },
    },
    buttonChild: {
        display: "flex",
        width: "100%",
        justifyContent: "center",
        alignItems: "center"
    }
}));

export default function LoginComponent (props) {
    const classes = useStyles();
    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    });

    const [errors, setErrors] = useState({
        username: false,
        password: false
    });
    const [error_message, setErrorMessage] = useState("");
    const [is_loading, setLoading] = useState(false);

    const { history, onLogin } = props;
    const onLoginClick = () => {
        Object.entries(credentials).forEach(row => {
            const [key, value] = row;
            if (value === "") handleError(key, value);
        });

        if (Object.values(errors).includes(true)) {
            setErrorMessage("Fill up all required fields");
        } else {
            setLoading(true);
            login(credentials, () => {
                setLoading(false);
                onLogin();
                history.push("/");
            }, message => {
                setLoading(false);
                setErrorMessage(message);
            });
        }
    };

    const { username, password } = credentials;
    const handleChange = attr => event => {
        const { target: { value } } = event;
        setCredentials({
            ...credentials,
            [attr]: value
        });

        setErrorMessage("");
        handleError(attr, value);
    };
    const handleFocus = attr => event => {
        handleError(attr, credentials[attr]);
    };
    const handleError = (attr, value) => {
        setErrors({
            ...errors,
            [attr]: value === ""
        });
    };

    const handleEnterPress = event => {
        if (event.key === "Enter") onLoginClick();
    };

    return (
        <Grid container component="main" className={classes.root}>
            <CssBaseline />
            <Grid item xs={false} sm={4} md={7} className={classes.image} />
            <Grid 
                item 
                xs={12} sm={8} md={5} 
                component={Paper} 
                elevation={6} 
                square
                className={classes.paperContainer}
            >
                <div className={classes.paper}>
                    <img
                        src={PhivolcsDynaslopeLogo}
                        alt="PHIVOLCS-Dynaslope Logo"
                        className={classes.phivolcsDynaslopeLogo}
                    />
                    <Typography 
                        component="h1"
                        variant="h5"
                        align="center"
                        className={classes.title}
                    >
                        <strong>MONITORING AND INFORMATION APPLICATION (MIA 3.0)</strong>
                    </Typography>
                    <div className={classes.form}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={handleChange("username")}
                            onFocus={handleFocus("username")}
                            error={errors.username}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={handleChange("password")}
                            onKeyPress={handleEnterPress}
                            onFocus={handleFocus("password")}
                            error={errors.password}
                            className={classes.passwordField}
                        />
                        {
                            error_message !== "" && (
                                <FormHelperText error focused>
                                    {error_message}
                                </FormHelperText>
                            )
                        }
                        {/* <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me"
                        /> */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                            onClick={onLoginClick}
                            disabled={is_loading}
                        >
                            {
                                is_loading ? (
                                    <div className={classes.buttonChild}>
                                        <span style={{ marginRight: 6 }}>Signing In... </span>
                                        <CircularProgress color="secondary" size={20} />
                                    </div>
                                ) : (
                                    <span>Sign In</span>
                                )
                            }
                        </Button>

                        {/* <Grid container>
                            <Grid item xs>
                                <Link href="#" variant="body2">
                                    Forgot password?
                                </Link>
                            </Grid>
                            <Grid item>
                                <Link href="#" variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid> */}
                        <Box mt={5}>
                            <Copyright />
                        </Box>
                    </div>
                </div>
            </Grid>
        </Grid>
    );
}