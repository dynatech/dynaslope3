import React, { Component } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Slide,
    Fade, IconButton, withStyles,
    FormControl, FormLabel, FormGroup
} from "@material-ui/core";
import { CheckCircle, RemoveCircle } from "@material-ui/icons";
import { compose } from "recompose";
import CheckboxGroup from "../../reusables/CheckboxGroup";
import {
    sites as Sites,
    organizations as Organizations
} from "../../../store";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available",
        marginTop: 8,
        "&:first-child": {
            marginTop: 12,
        }
    },
    formLabel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
    },
    checkboxSites: {
        flex: "1 1 25%",
        [theme.breakpoints.down("xs")]: {
            "&:last-child": {
                flexBasis: "58.5%"
            }
        },
        [theme.breakpoints.up("sm")]: {
            flexBasis: "17%"
        },
        [theme.breakpoints.up("md")]: {
            flexBasis: "9%"
        },
    },
    checkboxOrganizations: {
        flex: "1 1 45%",
        [theme.breakpoints.up("sm")]: {
            flexBasis: "17%",
            "&:last-child": {
                flexBasis: "77%"
            }
        },
        [theme.breakpoints.up("md")]: {
            flexBasis: "9%",
            "&:last-child": {
                flexBasis: "45%"
            }
        },
    },
    checkboxGroup: {
        flexDirection: "row",
        paddingTop: 6
    },
    buttons: {
        [theme.breakpoints.down("xs")]: {
            padding: "12px 6px"
        }
    }
});

function renderCheckboxes (classes, entry, state_handlers) {
    const { state, group, list } = entry;
    const { handleCheckAll, handleChange } = state_handlers;
    const lgroup = group.toLowerCase();

    return (
        <FormControl component="fieldset" className={classes.formControl} key={group}>
            <FormLabel component="legend" className={classes.formLabel}>
                <span>{group}</span>

                <span>
                    {
                        [
                            { label: "Check all", component: <CheckCircle />, bool: true },
                            { label: "Uncheck all", component: <RemoveCircle />, bool: false }
                        ].map(line => (
                            <IconButton
                                aria-label={line.label}
                                color="primary"
                                className={classes.buttons}
                                onClick={handleCheckAll(lgroup, line.bool)}
                                key={line.label}
                            >
                                {line.component}
                            </IconButton>
                        ))
                    }
                </span>
            </FormLabel>
            <FormGroup className={classes.checkboxGroup}>
                <CheckboxGroup
                    choices={list.map(x => listMapper(x, group, state))}
                    changeHandler={handleChange(lgroup)}
                    checkboxStyle={classes[`checkbox${group}`]}
                />
            </FormGroup>
        </FormControl>
    );
}

function listMapper (x, group, state) {
    if (group === "Sites") {
        const id = `${x.site_id}`;
        return {
            state: state.get(id),
            value: id,
            label: x.site_code.toUpperCase()
        };
    }

    // if (group === "Organizations")
    return {
        state: state.get(x),
        value: x,
        label: x.toUpperCase()
    };
}

class QuickSelectModal extends Component {
    state = {
        sites: new Map(),
        organizations: new Map(),
        only_ewi_recipients: true
    }

    componentDidMount () {
        const sites = Sites.map(site => [`${site.site_id}`, false]);
        const sites_map = new Map(sites);

        const orgs = Organizations.map(org => [org, false]);
        const orgs_map = new Map(orgs);

        this.setState({ sites: sites_map, organizations: orgs_map });
    }
    
    handleChange = prop => value => e => {
        const is_checked = e.target.checked;
        this.setState(prevState => {
            const update = (prop === "only_ewi_recipients")
                ? is_checked
                : prevState[prop].set(value, is_checked);
            return { [prop]: update };
        });
    }

    handleCheckAll = (prop, bool) => () => {
        this.setState(prevState => {
            prevState[prop].forEach((v, key) => {
                prevState[prop].set(key, bool);
            });

            return { [prop]: prevState[prop] };
        });
    }
   
    render () {
        const { classes, fullScreen, value, closeHandler } = this.props;
        const { sites, organizations, only_ewi_recipients } = this.state;
        const state_handlers = {
            handleCheckAll: this.handleCheckAll,
            handleChange: this.handleChange
        };

        return (
            <div>
                <Dialog
                    fullWidth
                    fullScreen={fullScreen}
                    open={value}
                    aria-labelledby="form-dialog-title"
                    TransitionComponent={fullScreen ? SlideTransition : FadeTransition}
                    maxWidth="md"
                >
                    <DialogTitle id="form-dialog-title">
                        Select recipients
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Choose your preferred sites and offices as message recipients.
                        </DialogContentText>
                        
                        <FormControl className={classes.formControl}>
                            <CheckboxGroup
                                choices={[{ state: only_ewi_recipients, value: "only_ewi_recipients", label: "Include selected EWI recipients only" }]}
                                changeHandler={this.handleChange("only_ewi_recipients")}
                            />
                        </FormControl>

                        {
                            [
                                { state: organizations, group: "Organizations", list: Organizations },
                                { state: sites, group: "Sites", list: Sites }
                            ].map(entry => renderCheckboxes(classes, entry, state_handlers))
                        }
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeHandler} color="primary">
                            Select
                        </Button>
                        <Button onClick={closeHandler}>
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default compose(withMobileDialog(), withStyles(styles))(QuickSelectModal);
