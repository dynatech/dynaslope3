import React, { 
    Fragment, useState, useEffect,
    useRef
} from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";

import { withStyles } from "@material-ui/core";

import LoginComponent from "./components/sessions/Login";
import { Header, Footer, Navigation } from "./components/layouts";
import { isLoggedIn, refreshSession } from "./components/sessions/auth";

import RoutesCollection from "./Routes";

const styles = theme => ({
    app: {
        height: "100%",
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
    },
    body: { 
        // Margin to accomodate sticky nature of header and navigation
        marginTop: 60,
        [theme.breakpoints.up("sm")]: {
            marginTop: 70
        },
        [theme.breakpoints.up("md")]: {
            marginTop: 124
        }
    }
});

function App (props) {
    const { classes } = props;
    const [drawer, setDrawer] = useState(false);

    const toggleDrawer = bool => () => {
        setDrawer(bool);
    };

    const [is_logged, setIsLogged] = useState(null);
    const interval_ref = useRef(false);
    
    useEffect(() => {
        isLoggedIn(bool => {
            setIsLogged(bool);
            clearInterval(interval_ref.current);
            interval_ref.current = setInterval(refreshSession, 1000 * 60 * 5); // 1000 * 60 * 25
        });

        return () => clearInterval(interval_ref.current);
    }, []);

    const onLogout = () => {
        setIsLogged(false);
        clearInterval(interval_ref.current);
    };

    return (
        <BrowserRouter>
            <Switch>
                <Route exact path="/login" render={r_props => {
                    return (
                    // eslint-disable-next-line no-nested-ternary
                        is_logged === null ? (
                            <div>Loading...</div>
                        ) : (
                            !is_logged ? (
                                <LoginComponent {...r_props} setIsLogged={setIsLogged} />
                            ) : (
                                <Redirect to="/" />
                            )
                        )
                    );
                }} />
                <Route path="/" render={r_props => {
                    return (
                    // eslint-disable-next-line no-nested-ternary
                        is_logged === null ? (
                            <div>Loading...</div>
                        ) : (
                            is_logged ? (
                                <Fragment>
                                    <Header
                                        {...r_props} 
                                        drawerHandler={toggleDrawer}
                                        onLogout={onLogout}
                                    />
                                    <Navigation
                                        drawerHandler={toggleDrawer}
                                        drawer={drawer}
                                    />
                                    
                                    <div className={classes.app}>
                                        <div className={classes.body}>
                                            <RoutesCollection {...r_props} />
                                        </div>
                                    </div>
                            
                                    <Footer />
                                </Fragment>
                            ) : (
                                <Redirect to="/login" />
                            )
                        )
                    );
                }} />
            </Switch>
        </BrowserRouter>

    // <BrowserRouter>
    //     <RC2 />
    // </BrowserRouter>
    );
}

export default withStyles(styles)(App);
