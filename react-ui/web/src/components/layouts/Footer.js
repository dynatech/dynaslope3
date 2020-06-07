import React from "react";
import {
    AppBar, Toolbar, Typography
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    footer: {
        display: "flex",
        // minHeight: "10vh",
        padding: "2% 0",
        flexDirection: "column",
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        [theme.breakpoints.down("sm")]: {
            marginTop: 30
        },
        zIndex: 0
    },
    footerText: {
        fontSize: "0.5rem",
        [theme.breakpoints.up("sm")]: {
            fontSize: "0.85rem",
        }
    }
});

function Footer (props) {
    const { classes } = props;

    return (
        <AppBar position="static" className={classes.footer}>
            <Toolbar>
                <Typography variant="subtitle2" color="inherit" className={classes.footerText} >
                    4F PHIVOLCS Building, C. P. Garcia Avenue, UP Campus, Diliman, Quezon City 1101 <br />
                    Tel. no. (02) 8426-1468 loc. 401 & 403 | dynaslope.phivolcs@gmail.com <br />
                    www.facebook.com/dynaslopecommunity
                </Typography>
            </Toolbar>
        </AppBar>
    );
}

export default withStyles(styles)(Footer);
