import React, { useState, useEffect, useContext } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton, makeStyles,
    FormControl, FormLabel, FormGroup,
    FormControlLabel, Checkbox
} from "@material-ui/core";
import { CheckCircle, RemoveCircle } from "@material-ui/icons";
import CheckboxGroup from "../../reusables/CheckboxGroup";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { GeneralContext } from "../../contexts/GeneralContext";

const useStyles = makeStyles(theme => ({
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
}));

function renderCheckboxes (classes, entry, state_handlers) {
    const { state_list, group, list } = entry;
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
                    choices={list.map(x => listMapper(x, group, state_list))}
                    changeHandler={handleChange(lgroup)}
                    checkboxStyle={classes[`checkbox${group}`]}
                />
            </FormGroup>
        </FormControl>
    );
}

function listMapper (x, group, state_list) {
    let id;
    if (group === "Sites") {
        id = "site_id";
    } else if (group === "Organizations") {
        id = "org_id";
    }

    const arr = state_list.filter(row => row.value === x[id]);
    return arr.pop();
}

function QuickSelectModal (props) {
    const { fullScreen, value, closeHandler } = props;
    const classes = useStyles();

    const { sites: site_list, organizations: org_list } = useContext(GeneralContext);

    const initial_sites = site_list.map(row => ({
        label: row.site_code.toUpperCase(),
        value: row.site_id,
        state: false
    }));

    const initial_orgs = org_list.map(row => {
        let pre = "";
        switch (row.scope) {
            case 1:
                pre = "Barangay "; break;
            case 2:
                pre = "Municipal "; break;
            case 3:
                pre = "Provincial "; break;
            case 4:
                pre = "Regional "; break;
            case 5:
                pre = "National "; break;
            default:
                break;
        }

        return {
            label: pre + row.name.toUpperCase(),
            value: row.org_id,
            state: false
        };
    });

    const [only_ewi_recipients, setOnlyEwiRecipients] = useState(false);
    const [sites, setSites] = useState(initial_sites);
    const [organizations, setOrganizations] = useState(initial_orgs);

    const handleChange = prop => val => e => {
        const is_checked = e.target.checked;

        if (prop === "only_ewi_recipient") {
            setOnlyEwiRecipients(is_checked);
        } else {
            let list;
            let setter;
            if (prop === "sites") {
                list = sites;
                setter = setSites;
            } else if (prop === "organizations") {
                list = organizations;
                setter = setOrganizations;
            }

            const index = list.findIndex(x => x.value === val);
            list[index].state = is_checked;
            setter([ ...list ]);
            
        }
    };
        
    const handleCheckAll = (prop, bool) => () => {
        let list;
        let setter;
        if (prop === "sites") {
            list = sites;
            setter = setSites;
        } else if (prop === "organizations") {
            list = organizations;
            setter = setOrganizations;
        }

        const arr = list.map(x => ({ ...x, state: bool }));
        setter([ ...arr ]);
    };

    const state_handlers = { handleCheckAll, handleChange };

    const selectHandler = () => {
        const site_ids = [];
        const org_ids = [];

        sites.forEach(row => {
            if (row.state) site_ids.push(row.value);
        });

        organizations.forEach(row => {
            if (row.state) org_ids.push(row.value);
        });

        console.log({
            site_ids,
            org_ids,
            only_ewi_recipients
        });

        closeHandler();
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
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={only_ewi_recipients}
                                    onChange={e => setOnlyEwiRecipients(e.target.checked)}
                                    value="only_ewi_recipients"
                                    className={classes.checkboxes}
                                />
                            }
                            label="Only EWI Recipients"
                        />
                    </FormControl>

                    {
                        [
                            { state_list: organizations, group: "Organizations", list: org_list },
                            { state_list: sites, group: "Sites", list: site_list }
                        ].map(row => renderCheckboxes(classes, row, state_handlers))
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={selectHandler} color="primary">
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

export default withMobileDialog()(QuickSelectModal);
