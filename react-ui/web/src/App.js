import React, { 
    useState, useEffect,
    useRef
} from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";

import { withStyles } from "@material-ui/core";

import LoginComponent from "./components/sessions/Login";
import { Header, Footer, Navigation } from "./components/layouts";
import { isLoggedIn, refreshSession } from "./components/sessions/auth";

import RoutesCollection from "./Routes";
import { access_refresh_interval } from "./config";

import BulletinTemplate from "./components/widgets/bulletin/BulletinTemplate";
import ChartRenderingContainer from "./components/chart_rendering/Container";

import { CTProvider } from "./components/monitoring/dashboard/CTContext";
import { GeneralProvider } from "./components/contexts/GeneralContext";
import { ServerTimeProvider } from "./components/contexts/ServerTimeContext";

const styles = theme => ({
    app: {
        height: "100%",
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&.scroll": {
            backgroundColor:"red",
        }
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
    
    useEffect(() => {
        document.title = "MIA 3.0 - Dynaslope Monitoring and Information Application";
    }, []);

    const [drawer, setDrawer] = useState(false);
    const toggleDrawer = bool => () => {
        setDrawer(bool);
    };

    const [is_logged, setIsLogged] = useState(null);
    const interval_ref = useRef(false);
    useEffect(() => {
        isLoggedIn(bool => {
            setIsLogged(bool);
            
            if (bool) {
                interval_ref.current = setInterval(refreshSession, access_refresh_interval);
            }
        });

        return () => clearInterval(interval_ref.current);
    }, []);

    const onLogin = () => {
        setIsLogged(true);
        interval_ref.current = setInterval(refreshSession, access_refresh_interval);
    };

    const onLogout = () => {
        setIsLogged(false);
        clearInterval(interval_ref.current);
    };

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/bulletin/:release_id" component={BulletinTemplate} />
                <Route path="/chart_rendering/:site_code/:ts_end/:chart_type/:tsm_sensor?" component={ChartRenderingContainer} />
                <Route exact path="/login" render={r_props => {
                    return (
                    // eslint-disable-next-line no-nested-ternary
                        is_logged === null ? (
                            <div>Loading...</div>
                        ) : (
                            !is_logged ? (
                                <LoginComponent {...r_props} onLogin={onLogin} />
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
                                // <ConnectionNotifierProvider>
                                <GeneralProvider>
                                    <CTProvider>
                                        <ServerTimeProvider>
                                            <Header
                                                {...r_props} 
                                                drawerHandler={toggleDrawer}
                                                onLogout={onLogout}
                                            />
                                            <Navigation
                                                {...r_props}
                                                drawerHandler={toggleDrawer}
                                                drawer={drawer}
                                                onLogout={onLogout}
                                            />
                                    
                                            <div className={classes.app}>
                                                <div className={classes.body}>
                                                    <RoutesCollection {...r_props} />
                                                </div>
                                            </div>
                            
                                            <Footer />
                                        </ServerTimeProvider>
                                    </CTProvider>
                                </GeneralProvider>
                                // </ConnectionNotifierProvider>
                            ) : (
                                <Redirect to="/login" />
                            )
                        )
                    );
                }} />
            </Switch>
        </BrowserRouter>
    );
}

export default withStyles(styles)(App);
