import React, {
    useState, useEffect, useContext
} from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { GeneralContext } from "../../contexts/GeneralContext";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import ContactList from "./ContactList";


function SearchContactsModal (props) {
    const {
        fullScreen, 
        modalState, modalStateHandler,
        isMobile, contactsArray, classes, setChosenContact
    } = props;

    const {
        organizations: orgs_list
    } = useContext(GeneralContext);

    const [org_options, setOrgOptions] = useState([]);
    useEffect(() => {
        const temp = orgs_list.map(row => {
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
                value: row.org_id,
                label: pre + row.name.toUpperCase()
            };
        });
        setOrgOptions(temp);
    }, [orgs_list]);

    const [sites, setSites] = useState(null);
    const [organization, setOrganizations] = useState(null);
    const [results, set_results] = useState([]);

    const onContactClickFn = React.useCallback(row => () => {
        setChosenContact(row);
        compound_fn();
    }, []);

    const compound_fn = () => {
        modalStateHandler();
    };

    const handleChange = name => value => {
        if (name === "sites") {
            setSites(value);
        } else if (name === "organizations") {
            setOrganizations(value);
        }
    };
 
    useEffect(() => {
        let filtered = [];

        if (organization !== null) {
            const orgs = organization.map(org => {
                return org.value;
            });

            const population = contactsArray;
            filtered = population.filter(row => {
                const { organizations } = row;
                let org_id = null;
                if (organizations.length !== 0) 
                    // eslint-disable-next-line prefer-destructuring
                    org_id = organizations[0].organization.org_id; 

                return orgs.includes(org_id);         
            });
        }

        if (sites !== null) {
            const site_codes = sites.map(site => {
                return site.data.site_code;
            });

            let population = contactsArray;
            if (filtered.length !== 0) population = filtered;

            filtered = [];
            population.forEach(row => {
                const { organizations } = row;
                organizations.every(value => {
                    const { site: { site_code } } = value;
                    if (site_codes.includes(site_code)) {
                        filtered.push(row);
                        return false;
                    }
                    return true;
                });
            });
        }

        if (filtered.length > 0) set_results(filtered);
        else set_results(null);
    }, [organization, sites]);

    const ListContent = () => {
        if (results !== null) {
            return (
                <ContactList 
                    {...props} 
                    contacts={results}
                    classes = {classes}
                    onContactClickFn={onContactClickFn}

                />); }
        return null;
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
                    <span>Search contacts</span>
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
            <DialogContent style={{ overflowY: "auto" }}>
                <DialogContentText>
                    Fill in the following 
                </DialogContentText>

                <div style={{ margin: "24px 0" }}>
                    <DynaslopeSiteSelectInputForm
                        value={sites}
                        changeHandler={value => setSites(value)}
                        isMulti
                    />     
                </div>

                <div style={{ margin: "24px 0" }}>
                    <SelectMultipleWithSuggest
                        label="Organizations"
                        options={org_options}
                        value={organization}
                        changeHandler={handleChange("organizations")}
                        placeholder="Select organizations"
                        renderDropdownIndicator={false}
                        openMenuOnClick
                        isMulti
                    />
                </div>

                {ListContent()}
                
                {
                    !isMobile && <div style={{ height: 240 }} />
                }    
            </DialogContent>
            <DialogActions>
                <Button onClick={modalStateHandler}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(SearchContactsModal);
