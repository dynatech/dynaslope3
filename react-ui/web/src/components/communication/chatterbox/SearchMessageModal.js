import React, { Component } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, IconButton, withStyles
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { Close } from "@material-ui/icons";
import { compose } from "recompose";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import {
    sites as Sites,
    organizations as Organizations
} from "../../../store";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

const styles = theme => ({
    link: { textDecoration: "none" }
});

const sites_option = Sites.map(site => ({
    value: site.site_id,
    label: site.site_code.toUpperCase(),
}));

const orgs_option = Organizations.map(org => ({
    value: org,
    label: org.toUpperCase(),
}));

class SearchMessageModal extends Component {
    state = {
        sites: null,
        organizations: null
    }

    handleChange = name => value => {
        this.setState({
            [name]: value,
        });
    };
    

    render () {
        const {
            classes, fullScreen, modalStateHandler,
            modalState, url, clickHandler,
            isMobile
        } = this.props;
        const { sites, organizations } = this.state;
        const compound_fn = () => {
            modalStateHandler();
            clickHandler();
        };

        return (
            <Dialog
                fullWidth
                fullScreen={fullScreen}
                open={modalState}
                aria-labelledby="form-dialog-title"
                TransitionComponent={fullScreen ? SlideTransition : FadeTransition}
                    
            >
                <DialogTitle id="form-dialog-title">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Search messages</span>
                        <IconButton 
                            color="inherit" 
                            onClick={modalStateHandler}
                            aria-label="Close"
                            style={{ padding: 0 }}
                        >
                            <Close />
                        </IconButton>
                    </div>
                </DialogTitle>
                <DialogContent style={{ overflowY: "hidden" }}>
                    <DialogContentText>
                        Fill in the following 
                    </DialogContentText>

                    <div style={{ margin: "24px 0" }}>
                        <SelectMultipleWithSuggest
                            label="Organizations"
                            options={orgs_option}
                            value={organizations}
                            changeHandler={this.handleChange("organizations")}
                            placeholder="Select organizations"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                            isMulti
                        />
                    </div>
                    
                    <div style={{ margin: "24px 0" }}>
                        <SelectMultipleWithSuggest
                            label="Sites"
                            options={sites_option}
                            value={sites}
                            changeHandler={this.handleChange("sites")}
                            placeholder="Select sites"
                            renderDropdownIndicator={false}
                            openMenuOnClick
                            isMulti
                        />
                    </div>

                    {
                        !isMobile && <div style={{ height: 240 }} />
                    }
                
                </DialogContent>
                <DialogActions>
                    <Button onClick={compound_fn} color="primary">
                        <Link to={{
                            pathname: `${url}/search_results`,
                            state: {
                                sites, organizations
                            }
                        }} className={classes.link}>
                        Search
                        </Link>
                    </Button>
                    <Button onClick={modalStateHandler}>
                    Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default compose(withStyles(styles), withMobileDialog())(SearchMessageModal);
