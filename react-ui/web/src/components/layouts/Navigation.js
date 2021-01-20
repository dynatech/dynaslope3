import React, { useState, useEffect, Fragment, useContext } from "react";
import { Link } from "react-router-dom";

import {
    AppBar, Tabs, Tab,
    MenuItem, MenuList,
    Popper, Paper, Grow, ClickAwayListener,
    makeStyles, Grid,
    Typography
} from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";

import moment from "moment";

import ScreenDrawer from "./ScreenDrawer";
import { ServerTimeContext } from "../contexts/ServerTimeContext";

const useStyles = makeStyles(theme => ({
    navBar: {
        display: "none",
        [theme.breakpoints.up("md")]: {
            display: "block",
        }
    },
    appBar: { top: 70 },
    popper: {
        zIndex: 500,
        marginTop: 2
    },
    list: { width: 250 },
    link: { 
        textDecoration: "none",
        color: "blue"
    }
}));

const navigation_labels = [
    {
        key: "monitoring",
        main: "Monitoring",
        sub: [
            {
                label: "Dashboard",
                link: "/"
            },
            {
                label: "Events Table",
                link: "/monitoring/events"
            },
            {
                label: "Shifts and Reports",
                link: "/monitoring/shifts_and_reports"
            },
            {
                label: "Issues and Reminders",
                link: "/monitoring/issues_and_reminders"
            },
            {
                label: "Site Logs",
                link: "/monitoring/logs"
            },
            {
                label: "Quality Assurance",
                link: "/monitoring/qa",
            }
        ]
    },
    {
        key: "analysis",
        main: "Analysis",
        sub: [
            {
                label: "Site Data Analytics",
                link: "/analysis/sites"
            },
            {
                label: "Communications Analytics",
                link: "/analysis/communications"
            },
            {
                label: "Monitoring Alerts Analytics",
                link: "/analysis/alerts"
            },
            {
                divider: true
            },
            {
                label: "Loggers and Sensors Form",
                link: "/analysis/forms/loggers_and_sensors"
            }
        ]
    },
    {
        key: "communication",
        main: "Communication",
        sub: [
            {
                label: "Chatterbox",
                link: "/communication/chatterbox"
            },
            {
                label: "Contacts",
                link: "/communication/contacts"
            },
            {
                label: "Mailbox",
                link: "/communication/mailbox"
            }
        ]
    },
    {
        key: "community",
        main: "Community",
        sub: [
            {
                label: "Site Information",
                link: "/community/site_info"
            },
            {
                label: "Stakeholders' Concerns",
                link: "/community/concerns",
                soon: true
            },
            {
                label: "Community Feedback",
                link: "/community/feedback",
                soon: true
            }
        ]
    },
    {
        key: "knowledge",
        main: "Knowledge Management",
        sub: [
            {
                label: "Protocols",
                link: "/knowlegde/protocols",
                soon: true
            },
            {
                label: "Papers",
                link: "/knowledge/papers",
                soon: true
            }
        ]
    }
];

function Navigation (props) {
    const {
        width, drawerHandler, drawer,
        history, onLogout
    } = props;
    const classes = useStyles();

    const { pathname } = window.location;
    const path = pathname.split("/")[1];
    const index = navigation_labels.findIndex(obj => obj.key === path);

    const [value, setValue] = useState(index === -1 ? 0 : index);
    const [from_tab, setFromTab] = useState(null);
    const [last_clicked_tab, setLastClickedTab] = useState(null);
    const [popper_open, setPopperOpen] = useState(false);
    const [anchorEl, setAnchorE1] = useState(null);
    const { server_time } = useContext(ServerTimeContext);

    const tab = value === from_tab && last_clicked_tab !== null ? last_clicked_tab : value;
    const { sub } = navigation_labels[tab];

    useEffect(() => {
        setLastClickedTab(value);
    }, [value]);

    const handleTabChange = (event, val) => {
        setValue(val);
    };

    const handleNavTabClick = event => { 
        const old_value = value;

        setPopperOpen(true);
        setAnchorE1(event.currentTarget);
        setFromTab(old_value);
    };

    const handlePopperClickAway = event => {
        if (anchorEl.contains(event.target)) {
            return;
        }
        
        setPopperOpen(false);
        setTimeout(() => setValue(from_tab), 100);
    };

    const handleMenuClick = event => {
        setPopperOpen(false);
    };

    return (
        <Fragment>
            <div className={classes.navBar}>
                <AppBar position="fixed" color="default" className={classes.appBar}>
                    <Grid container spacing={0} alignItems="center">
                        <Grid item xs={10}>
                            <Tabs
                                value={value}
                                onChange={handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                variant={isWidthUp("md", width) ? "standard" : "scrollable"}
                                scrollButtons="on"
                                centered={isWidthUp("md", width)}
                            >
                                {navigation_labels.map(({ main, key }) => 
                                    <Tab
                                        key={key}
                                        label={main}
                                        aria-owns={popper_open ? "monitoring-menu" : null}
                                        aria-haspopup="true"
                                        onClick={handleNavTabClick}
                                    />
                                )}
                            </Tabs>
                        </Grid>
                        <Grid item xs={2} align="center">
                            <Typography variant="button">
                                {
                                    server_time 
                                        ? moment(server_time).format("ddd DD-MMM-YYYY HH:mm:ss")
                                        : "Loading server time..."
                                }
                            </Typography>
                        </Grid>
                    </Grid>
                </AppBar>
            </div>

            <Popper
                className={classes.popper}
                open={popper_open}
                anchorEl={anchorEl}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        id="monitoring-menu"
                        style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handlePopperClickAway}>
                                <MenuList>
                                    {
                                        sub.map((row, i) => {
                                            const { label, link, soon, divider } = row;
                                            const disabled = typeof soon !== "undefined";
                                            if (disabled) {
                                                return (
                                                    <MenuItem
                                                        key={label}
                                                        onClick={handleMenuClick}
                                                        disabled={disabled}
                                                    >
                                                        {label}
                                                        {
                                                            disabled && <Typography
                                                                component="span"
                                                                variant="overline"
                                                                style={{ paddingLeft: 4 }}
                                                            >
                                                                SOON
                                                            </Typography>
                                                        }
                                                    </MenuItem>
                                                );
                                            }

                                            if (typeof divider !== "undefined") {
                                                return (
                                                    <MenuItem
                                                        key={i}
                                                        divider button={false}
                                                        style={{ paddingTop: 2, marginBottom: 8 }}/>
                                                );
                                            }

                                            return (
                                                <Link
                                                    to={link}
                                                    key={label}
                                                    className={classes.link}
                                                >
                                                    <MenuItem 
                                                        onClick={handleMenuClick}
                                                    >
                                                        {label}
                                                    </MenuItem>
                                                </Link>
                                            );
                                        })
                                    }
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
                
            <ScreenDrawer
                drawer={drawer}
                drawerHandler={drawerHandler}
                navigationLabels={navigation_labels}
                history={history}
                onLogout={onLogout}
            />
        </Fragment>
    );
}

export default React.memo(withWidth()(Navigation));