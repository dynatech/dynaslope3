import React, { useState } from "react";
import {
    AppBar, Toolbar, Typography,
    Menu, MenuItem, IconButton,
    Badge, Button
} from "@material-ui/core";
import {
    Menu as MenuIcon,
    AccountCircle,
    Mail as MailIcon,
    Notifications as NotificationsIcon
} from "@material-ui/icons";
import { withStyles } from "@material-ui/core/styles";
import DynaLogo from "../../images/dynaslope-logo.png";
import DostPhivolcsLogo from "../../images/dost-phivolcs-logo.png";
import GeneralStyles from "../../GeneralStyles";
import { logout, getCurrentUser } from "../sessions/auth";

const styles = theme => ({
    root: {
        width: "100%",
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        display: "flex",
        marginLeft: -12,
        marginRight: 0,
        [theme.breakpoints.up("md")]: {
            display: "none"
        },
    },
    projectTitle: {
        display: "block",
        fontWeight: 900,
        marginLeft: "1rem",
        [theme.breakpoints.up("md")]: {
            marginLeft: 0,
        }
    },
    titleBlock: {
        display: "block",
        margin: "0 4px",
        alignItems: "center", 
        textAlign: "center",
        justifyContent: "center",
    },
    projectSubtitle: {
        display: "none",
        fontSize: "0.7rem",
        marginTop: -3,
        [theme.breakpoints.up("md")]: {
            display: "block",
        }
    },
    dynaLogo: {
        padding: "8px 0px",
        marginLeft: 0,
        [theme.breakpoints.up("md")]: {
            padding: "12px 0px",
            marginLeft: 12,
        },
    },
    sectionDesktop: {
        display: "none",
        [theme.breakpoints.up("md")]: {
            display: "flex",
        },
    },
    list: {
        width: 250,
    },
    menu: { marginTop: 40 }
});
  
function Header (props) {
    const {
        classes, drawerHandler, history,
        onLogout
    } = props;
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onClickLogout = () => {
        logout(() => {
            onLogout();
            history.push("/login");
        });
    };

    const { first_name } = getCurrentUser();
    
    return (
        <div className={classes.root}>
            <AppBar position="fixed" color="primary">
                <Toolbar>
                    <IconButton
                        onClick={drawerHandler(true)}
                        className={classes.menuButton}
                        color="inherit"
                        aria-label="Open drawer"
                    >
                        <MenuIcon />
                    </IconButton>

                    <img
                        src={DynaLogo}
                        alt="Dynaslope Logo"
                        className={`${classes.dynaLogo} ${classes.dynaslopeLogo} ${classes.sectionDesktop}`}
                    />
                    <div className={classes.titleBlock}>
                        <Typography className={classes.projectTitle} variant="h6" color="inherit" noWrap>
                            PROJECT DYNASLOPE
                        </Typography>
                        <Typography variant="caption" className={classes.projectSubtitle} color="inherit">
                            IMPLEMENTED AND FUNDED BY
                        </Typography>
                    </div>
                    <img
                        src={DostPhivolcsLogo}
                        alt="PHIVOLCS Logo"
                        className={`${classes.sectionDesktop} ${classes.phivolcsLogo}`}
                    />

                    <div className={classes.grow} />
                    <div className={classes.sectionDesktop}>
                        <IconButton color="inherit">
                            <Badge badgeContent={4} color="secondary">
                                <MailIcon />
                            </Badge>
                        </IconButton>
                        <IconButton color="inherit">
                            <Badge badgeContent={17} color="secondary">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <Button
                            aria-owns="menu-list-grow"
                            aria-haspopup="true"
                            onClick={handleClick}
                            color="inherit"
                            startIcon={<AccountCircle />}
                        >
                            <strong>{first_name}</strong>
                        </Button>
                        {/* <Typography variant="body2" component="div">
                            <strong>Kevin Dhale</strong>
                        </Typography> */}
                    </div>
                </Toolbar>
            </AppBar>

            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                className={classes.menu}
            >
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>My account</MenuItem>
                <MenuItem onClick={onClickLogout}>Logout</MenuItem>
            </Menu>
        </div>
    );
}
  
export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(Header);
