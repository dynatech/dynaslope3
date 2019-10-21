import React, { Fragment, useState, useEffect, useRef } from "react";
import { Redirect } from "react-router-dom";
import { withStyles } from "@material-ui/core";
import { Header, Footer, Navigation } from "../layouts";
import { isLoggedIn, refreshSession } from "./auth";

const styles = theme => ({
    app: {
        height: "100vh",
        minHeight: "100%",
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

function AuthenticatedPage (props) {
    const { ChildComponent, classes } = props;
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
            interval_ref.current = setInterval(refreshSession, 1000 * 60 * 25);
        });

        return () => clearInterval(interval_ref.current);
    }, []);

    return (
        // eslint-disable-next-line no-nested-ternary
        is_logged === null ? (
            <div>Redirecting to login page...</div>
        ) : (
            is_logged ? (
                <Fragment>
                    <Header drawerHandler={toggleDrawer}/>
                    <Navigation
                        drawerHandler={toggleDrawer}
                        drawer={drawer}
                    />
                    <div className={classes.app}>
                        <div className={classes.body}>
                            <ChildComponent />
                        </div>
    
                        <Footer />
                    </div>
                </Fragment>
            ) : (
                <Redirect to="/login" />
            )
        )
    );
}

export default withStyles(styles)(AuthenticatedPage);