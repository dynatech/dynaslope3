import React, {
    useState, useEffect, useContext
} from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton,
    makeStyles
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { Close } from "@material-ui/icons";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { GeneralContext } from "../../contexts/GeneralContext";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";

const useStyles = makeStyles(theme => ({
    link: { textDecoration: "none" }
}));

function SearchMessageModal (props) {
    const {
        fullScreen, modalStateHandler,
        setSearchResultsToEmpty,
        modalState, url,
        isMobile
    } = props;
    const classes = useStyles();

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

    const [sites, setSites] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const compound_fn = () => {
        modalStateHandler();
        setSearchResultsToEmpty();
    };

    const handleChange = name => value => {
        if (name === "sites") {
            setSites(value);
        } else if (name === "organizations") {
            setOrganizations(value);
        }
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
                    <span>Search Chatterbox</span>
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
                        options={org_options}
                        value={organizations}
                        changeHandler={handleChange("organizations")}
                        placeholder="Select organizations"
                        renderDropdownIndicator={false}
                        openMenuOnClick
                        isMulti
                    />
                </div>
                
                <div style={{ margin: "24px 0" }}>
                    <DynaslopeSiteSelectInputForm
                        value={sites}
                        changeHandler={value => setSites(value)}
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

export default withMobileDialog()(SearchMessageModal);
