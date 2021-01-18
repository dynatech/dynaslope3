import React, { useState, useContext } from "react";

import {
    AppBar, Toolbar, Typography,
    Menu, MenuItem, IconButton,
    Badge, Button, makeStyles,
    Paper, Slide, Backdrop
} from "@material-ui/core";
import {
    Menu as MenuIcon,
    AccountCircle,
    Mail as MailIcon,
    Notifications as NotificationsIcon,
    ExitToApp
} from "@material-ui/icons";

import NotificationsTab from "../widgets/notifications/NotificationsTab";
import PhivolcsDynaslopeLogo from "../../images/phivolcs-dynaslope-logo.png";
import GeneralStyles from "../../GeneralStyles";
import { logout, getCurrentUser } from "../sessions/auth";
import { NotificationsContext } from "../contexts/NotificationsContext";

const useStyles = makeStyles(theme => ({
    ...GeneralStyles(theme),
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
        fontWeight: 900
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
    logo: {
        marginRight: 12,
        [theme.breakpoints.down("sm")]: {
            marginRight: 0
        }
    },
    sectionDesktop: {
        display: "none",
        [theme.breakpoints.up("md")]: {
            display: "flex",
            padding: "4px 0"
        }
    },
    list: {
        width: 250,
    },
    menu: { marginTop: 40 },
    icon: { paddingRight: theme.spacing(2) },
    paper: {
        position: "fixed",
        right: 0,
        width: "45vw",
        [theme.breakpoints.down("sm")]: {
            width: "55vw"
        },
        [theme.breakpoints.up("lg")]: {
            width: "40vw"
        },
        height: "100vh",
        zIndex: 1300,
        padding: 24,
        overflowY: "auto",
        boxSizing: "border-box"
    },
    backdrop: { zIndex: 1299 }
}));
  
function Header (props) {
    const {
        drawerHandler, history,
        onLogout
    } = props;
    const [anchorEl, setAnchorEl] = useState(null);
    const classes = useStyles();

    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const onClickProfile = () => {
        history.push("/profile");
        handleClose();
    };

    const onClickLogout = () => {
        logout(() => {
            onLogout();
            history.push("/login");
        });
    };

    const { user_id, first_name } = getCurrentUser();
    const { notifications_object, setNotificationCountToZero, getUserNotifications } = useContext(NotificationsContext);
    const { count } = notifications_object;
    const [is_notif_open, setIsNotifOpen] = useState(false);

    const handleOpenNotif = () => {
        setIsNotifOpen(true);
        document.body.style.overflow = "hidden";
        getUserNotifications();
        console.log("notifications_object open", notifications_object);
    };

    const handleCloseNotif = () => {
        setIsNotifOpen(false);
        document.body.style.overflow = "auto";
        setNotificationCountToZero(user_id);
        console.log("notifications_object close", notifications_object);
    };

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
                        src={PhivolcsDynaslopeLogo}
                        alt="PHIVOLCS-Dynaslope Logo"
                        className={`${classes.phivolcsDynaslopeLogo} ${classes.logo} ${classes.sectionDesktop}`}
                    />

                    <div className={classes.titleBlock}>
                        <Typography className={classes.projectTitle} variant="h4" color="inherit" noWrap>
                            MIA 3.0
                        </Typography>
                        <Typography variant="caption" className={classes.projectSubtitle} color="inherit">
                            Monitoring and Information Application
                        </Typography>
                    </div>

                    <div className={classes.grow} />
                    <div className={classes.sectionDesktop}>
                        {/* <IconButton color="inherit">
                            <Badge badgeContent={4} color="secondary">
                                <MailIcon />
                            </Badge>
                        </IconButton> */}

                        <IconButton color="inherit" onClick={handleOpenNotif}>
                            <Badge badgeContent={count} color="secondary">
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
                <MenuItem onClick={onClickProfile}>
                    <AccountCircle className={classes.icon} /> Profile
                </MenuItem>
                <MenuItem onClick={onClickLogout}>
                    <ExitToApp className={classes.icon} /> Logout
                </MenuItem>
            </Menu>

            <Slide direction="left" in={is_notif_open} mountOnEnter>
                <Paper 
                    elevation={4}
                    className={classes.paper}
                >
                    <NotificationsTab history={history} handleCloseNotif={handleCloseNotif} />
                </Paper>
            </Slide>

            <Backdrop open={is_notif_open} className={classes.backdrop} onClick={handleCloseNotif} />
        </div>
    );
}
  
export default Header;
