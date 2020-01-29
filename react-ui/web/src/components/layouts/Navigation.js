import React, { useState, useEffect, Fragment } from "react";
import {
    AppBar, Tabs, Tab,
    MenuItem, MenuList,
    Popper, Paper, Grow, ClickAwayListener,
    makeStyles,
    Typography
} from "@material-ui/core";
import { Link } from "react-router-dom";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import ScreenDrawer from "./ScreenDrawer";

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
                soon: true
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
                link: "/analysis/communications",
                soon: true
            },
            {
                label: "Monitoring Alerts Analytics",
                link: "/analysis/alerts",
                soon: true
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

// class Navigation extends PureComponent {
//     constructor (props) {
//         super(props);

//         const { pathname } = window.location;
//         const path = pathname.split("/")[1];
//         const index = navigation_labels.findIndex(obj => obj.key === path);

//         this.state = {
//             value: index === -1 ? 0 : index,
//             from_tab: null,
//             last_clicked_tab: null,
//             popper_open: false,
//             anchorEl: null
//         };
//     }
   
//     const handleTabChange = event, value => {
//         setValue(value);
//     };

//     const handleNavTabClick = event => { 
//         const { value: old_value } = this.state;

//         this.setState({
//             popper_open: true,
//             anchorEl: event.currentTarget,
//             from_tab: old_value
//         }, () => {
//             const { value: updated_value } = this.state;
//             this.setState({ last_clicked_tab: updated_value });
//         });
//     };

//     handlePopperClickAway = event => {
//         const { anchorEl, from_tab } = this.state; 

//         if (anchorEl.contains(event.target)) {
//             return;
//         }
        
//         this.setState({ popper_open: false, value: from_tab });
//     };

//     handleMenuClick = event => {
//         this.setState({ popper_open: false });
//     }

//     render () {
//         const { width, classes, drawerHandler, drawer } = this.props;
//         const {
//             value, popper_open, anchorEl,
//             from_tab, last_clicked_tab
//         } = this.state;

//         const index = value === from_tab && last_clicked_tab !== null ? last_clicked_tab : value;
//         const { sub } = navigation_labels[index];
    
//         return (
//             <Fragment>
//                 <div className={classes.navBar}>
//                     <AppBar position="fixed" color="default" className={classes.appBar}>
//                         <Tabs
//                             value={value}
//                             onChange={this.const handleTabChange}
//                            indicatorColosetValue(value);                  textColor="primary"
//                             variant={isWidthUp("md", width) ? "standard" : "scrollable"}
//                             scrollButtons="on"
//                             centereconst d={isWidthUp("md", width)}
//                         >
//                             {navigation_labels.map(({ main, key }) => 
//                                 <Tab
//                                     key={key}
//                                     label={main}
//                                     aria-owns={popper_open ? "monitoring-menu" : null}
//                                     aria-haspopup="true"
//                                     onClick={this.handleNavTabClick}
//                                 />
//                             )}
//                         </Tabs>
//                     </AppBar>
//                 </div>

//                 <Popper
//                     className={classes.popper}
//                     open={popper_open}
//                     anchorEl={anchorEl}
//                     transition
//                     disablePortal
//                 >
//                     {({ TransitionProps, placement }) => (
//                         <Grow
//                             {...TransitionProps}
//                             id="monitoring-menu"
//                             style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}
//                         >
//                             <Paper>
//                                 <ClickAwayListener onClickAway={this.handlePopperClickAway}>
//                                     <MenuList>
//                                         {
//                                             sub.map(({ label, link }) =>
//                                                 <Link to={link} key={label} className={classes.link}>
//                                                     <MenuItem
//                                                         onClick={this.handleMenuClick}
//                                                     >
//                                                         {label}
//                                                     </MenuItem>
//                                                 </Link> 
//                                             )
//                                         }
//                                     </MenuList>
//                                 </ClickAwayListener>
//                             </Paper>
//                         </Grow>
//                     )}
//                 </Popper>
                
//                 <ScreenDrawer
//                     drawer={drawer}
//                     drawerHandler={drawerHandler}
//                     navigationLabels={navigation_labels}
//                 />
//             </Fragment>
//         );
//     }
// }

function Navigation (props) {
    const { width, drawerHandler, drawer } = props;
    const classes = useStyles();

    const { pathname } = window.location;
    const path = pathname.split("/")[1];
    const index = navigation_labels.findIndex(obj => obj.key === path);

    const [value, setValue] = useState(index === -1 ? 0 : index);
    const [from_tab, setFromTab] = useState(null);
    const [last_clicked_tab, setLastClickedTab] = useState(null);
    const [popper_open, setPopperOpen] = useState(false);
    const [anchorEl, setAnchorE1] = useState(null);

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
                                        sub.map(({ label, link, soon }) => {
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
            />
        </Fragment>
    );
}

export default React.memo(withWidth()(Navigation));