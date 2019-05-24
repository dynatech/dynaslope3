import React, { PureComponent, Fragment } from "react";
import {
    AppBar, Tabs, Tab,
    MenuItem, MenuList,
    Popper, Paper, Grow, ClickAwayListener,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { withStyles } from "@material-ui/core/styles";
import { compose } from "recompose";
import ScreenDrawer from "./ScreenDrawer";

const styles = theme => ({
    navBar: {
        display: "none",
        [theme.breakpoints.up("md")]: {
            display: "block",
        }
    },
    list: { width: 250 },
    link: { textDecoration: "none" }
});

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
                link: "/monitoring/qa"
            }
        ]
    },
    {
        key: "analysis",
        main: "Analysis",
        sub: [
            {
                label: "Integrated Site Analysis",
                link: "/analysis/sites"
            },
            {
                label: "Communications Analytics",
                link: "/analysis/communications"
            },
            {
                label: "Monitoring Alert Analysis",
                link: "/analysis/alerts"
            }
        ]
    },
    {
        key: "comms",
        main: "Communication",
        sub: [
            {
                label: "Chatterbox",
                link: "/communication/chatterbox"
            },
            {
                label: "Callbox",
                link: "/communication/callbox"
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
                label: "Sites Information",
                link: "/community/site_info"
            },
            {
                label: "Stakeholders' Concerns",
                link: "/community/concerns"
            },
            {
                label: "Community Feedback",
                link: "/community/feedback"
            }
        ]
    },
    {
        key: "knowledge",
        main: "Knowledge Management",
        sub: [
            {
                label: "Protocols",
                link: "/knowlegde/protocols"
            },
            {
                label: "Papers",
                link: "/knowledge/papers"
            }
        ]
    }
];

class Navigation extends PureComponent {
    state = {
        value: 0,
        from_tab: null,
        last_clicked_tab: null,
        popper_open: false,
        anchorEl: null
    };

    handleTabChange = (event, value) => {
        this.setState({ value });
    };

    handleNavTabClick = event => { 
        const { value: old_value } = this.state;

        this.setState({
            popper_open: true,
            anchorEl: event.currentTarget,
            from_tab: old_value
        }, () => {
            const { value: updated_value } = this.state;
            this.setState({ last_clicked_tab: updated_value });
        });
    };

    handlePopperClickAway = event => {
        const { anchorEl, from_tab } = this.state; 

        if (anchorEl.contains(event.target)) {
            return;
        }
        
        this.setState({ popper_open: false, value: from_tab });
    };

    handleMenuClick = event => {
        this.setState({ popper_open: false });
    }

    render () {
        const { width, classes, drawerHandler, drawer } = this.props;
        const {
            value, popper_open, anchorEl,
            from_tab, last_clicked_tab
        } = this.state;


        const index = value === from_tab && last_clicked_tab !== null ? last_clicked_tab : value;
        const { sub } = navigation_labels[index];
    
        return (
            <Fragment>
                <div className={classes.navBar}>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={value}
                            onChange={this.handleTabChange}
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
                                    onClick={this.handleNavTabClick}
                                />
                            )}
                        </Tabs>
                    </AppBar>
                </div>

                <Popper
                    style={{ zIndex: 2 }}
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
                                <ClickAwayListener onClickAway={this.handlePopperClickAway}>
                                    <MenuList>
                                        {
                                            sub.map(({ label, link }) =>
                                                <Link to={link} key={label} className={classes.link}>
                                                    <MenuItem
                                                        onClick={this.handleMenuClick}
                                                    >
                                                        {label}
                                                    </MenuItem>
                                                </Link> 
                                            )
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
                />
            </Fragment>
        );
    }
}

export default compose(
    withStyles(styles),
    withWidth()
)(Navigation);