import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import {
    SwipeableDrawer, List, ListItem,
    ListItemText, ListItemIcon, Divider,
    ListSubheader, Collapse, Badge, Typography,
    Toolbar
} from "@material-ui/core";
import {
    Mail as MailIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    ExpandLess, ExpandMore
} from "@material-ui/icons";
import { withStyles } from "@material-ui/core/styles";
import PhivolcsDynaslopeLogo from "../../images/phivolcs-dynaslope-logo.png";
import GeneralStyles from "../../GeneralStyles";

const styles = theme => ({
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
        height: 160,
        display: "block",
        alignItems: "center",
        textAlign: "center",
        // justifyContent: "center",
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
    // projectSubtitle: { fontSize: "0.65rem" },
    link: { textDecoration: "none" }
});

class ScreenDrawer extends Component {
    state = {
        open: {}
    }

    handleNestedList = (key) => {
        const { open } = this.state;
        const status = typeof open[key] === "undefined" ? false : open[key];

        this.setState(state => ({
            open: {
                [key]: !status
            }
        }));
    };

    render () {
        const { classes, drawerHandler, drawer, navigationLabels } = this.props;
        const { open } = this.state;

        const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
    
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
                            <ListItem button>
                                <ListItemIcon>
                                    <AccountCircle />
                                </ListItemIcon>
                                <ListItemText primary="Profile" />
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
                                            onClick={() => this.handleNestedList(key)}
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
}

export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(ScreenDrawer);