import React, { Fragment, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
    SwipeableDrawer, List, ListItem,
    ListItemText, ListItemIcon, Divider,
    ListSubheader, Collapse, Badge, Typography,
    Toolbar, makeStyles
} from "@material-ui/core";
import {
    Mail as MailIcon,
    Notifications as NotificationsIcon,
    AccountCircle, ExitToApp,
    ExpandLess, ExpandMore
} from "@material-ui/icons";

import moment from "moment";

import PhivolcsDynaslopeLogo from "../../images/phivolcs-dynaslope-logo.png";
import GeneralStyles from "../../GeneralStyles";
import { logout, getCurrentUser } from "../sessions/auth";
import { ServerTimeContext } from "../contexts/ServerTimeContext";

const useStyles = makeStyles(theme => ({
    ...GeneralStyles(theme),
    list: {
        width: 300,
        maxWidth: 360
    },
    nested: {
        paddingLeft: theme.spacing(3),
    },
    nestedText: {
        fontSize: "0.9rem"
    },
    drawerHeader: {
        height: 220,
        display: "block",
        alignItems: "center",
        textAlign: "center",
        padding: 16
    },
    logo: {
        height: 105
    },
    titleBlock: {
        display: "block",
        margin: "0 4px"
    },
    projectTitle: { fontWeight: 600 },
    link: { textDecoration: "none" }
}));

function ScreenDrawer (props) {
    const { 
        drawerHandler, drawer, navigationLabels,
        history, onLogout
    } = props;
    const classes = useStyles();
    const [open, isOpen] = useState({});
    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

    const { nickname } = getCurrentUser();
    const { server_time } = useContext(ServerTimeContext);

    const handleNestedList = key => {
        const status = typeof open[key] === "undefined" ? false : open[key];
        isOpen(state => ({ [key]: !status }));
    };

    const onClickProfile = () => {
        history.push("/profile");
    };

    const onClickLogout = () => {
        logout(() => {
            onLogout();
            history.push("/login");
        });
    };
    
    return (
        <SwipeableDrawer 
            open={drawer} 
            onClose={drawerHandler(false)}
            onOpen={drawerHandler(true)}
            disableBackdropTransition={!iOS}
            disableDiscovery={iOS}
        >
            <div
                tabIndex={0}
                role="button"
                onKeyDown={drawerHandler(false)}
            >
                <div className={classes.list}>
                    <Toolbar className={classes.drawerHeader}>
                        <img
                            src={PhivolcsDynaslopeLogo}
                            alt="PHIVOLCS-Dynaslope Logo"
                            className={`${classes.phivolcsDynaslopeLogo} ${classes.logo}`}
                        />

                        <Typography variant="h5" className={classes.projectTitle}>
                            MIA 3.0
                        </Typography>

                        <Typography variant="subtitle2" className={classes.projectSubtitle}>
                            Monitoring and Information Application
                        </Typography>

                        <Typography variant="subtitle1" style={{ marginTop: 6, fontWeight: 600 }}>
                            Hello {nickname}!
                        </Typography>

                        <Typography variant="button">
                            {
                                server_time 
                                    ? moment(server_time).format("ddd DD-MMM-YYYY HH:mm:ss")
                                    : "Loading server time..."
                            }
                        </Typography>
                    </Toolbar>

                    <Divider />

                    <List component="nav">
                        {/* <ListItem button>
                                <ListItemIcon>
                                    <Badge badgeContent={4} color="secondary">
                                        <MailIcon />
                                    </Badge>
                                </ListItemIcon>
                                <ListItemText primary="Messages" />
                            </ListItem>
                            <ListItem button>
                                <ListItemIcon>
                                    <Badge badgeContent={11} color="secondary">
                                        <NotificationsIcon />
                                    </Badge>
                                </ListItemIcon>
                                <ListItemText primary="Notifications" />
                            </ListItem> */}
                        <ListItem button onClick={onClickProfile}>
                            <ListItemIcon>
                                <AccountCircle />
                            </ListItemIcon>
                            <ListItemText primary="Profile" />
                        </ListItem>
                        <ListItem button onClick={onClickLogout}>
                            <ListItemIcon>
                                <ExitToApp />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>

                    <Divider />

                    <List
                        component="nav"
                        subheader={<ListSubheader component="div">Directory</ListSubheader>}
                    >
                        {
                            navigationLabels.map(({ key, main, sub }) => (
                                <Fragment key={key}>
                                    <ListItem
                                        button 
                                        onClick={() => handleNestedList(key)}
                                    >
                                        <ListItemText primary={main} />
                                        { open[key] ? <ExpandLess /> : <ExpandMore /> }
                                    </ListItem>

                                    <Collapse in={open[key]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {
                                                sub.map(({ label: sublabel, link }) => (
                                                    <Link to={link} key={sublabel} className={classes.link}>
                                                        <ListItem button className={classes.nested} onClick={drawerHandler(false)}>
                                                            <ListItemText 
                                                                primaryTypographyProps={{
                                                                    className: classes.nestedText
                                                                }}
                                                                primary={sublabel}/>
                                                        </ListItem>
                                                    </Link>
                                                ))
                                            }
                                        </List>
                                    </Collapse>
                                </Fragment>
                            ))
                        }
                    </List>
                </div>
            </div>
        </SwipeableDrawer>
    );
}

export default ScreenDrawer;