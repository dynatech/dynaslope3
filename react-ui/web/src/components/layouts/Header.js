import React, { Component } from "react";
import {
    AppBar, Toolbar, Typography,
    Menu, MenuItem, IconButton,
    Badge
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
    }
});
  
class HeaderBar extends Component {
    state = {
        anchorEl: null
    };
  
    handleProfileMenuOpen = event => {
        this.setState({ anchorEl: event.currentTarget });
    };
  
    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };
  
    render () {
        const { anchorEl } = this.state;
        const { classes, drawerHandler } = this.props;
        const isMenuOpen = Boolean(anchorEl);
  
        const renderMenu = (
            <Menu
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={isMenuOpen}
                onClose={this.handleMenuClose}
            >
                <MenuItem onClick={this.handleMenuClose}>Profile</MenuItem>
                <MenuItem onClick={this.handleMenuClose}>My account</MenuItem>
            </Menu>
        );

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
                            <IconButton
                                aria-owns={isMenuOpen ? "material-appbar" : undefined}
                                aria-haspopup="true"
                                onClick={this.handleProfileMenuOpen}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                        </div>
                    </Toolbar>
                </AppBar>
                {renderMenu}
            </div>
        );
    }
}
  
export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(HeaderBar);
