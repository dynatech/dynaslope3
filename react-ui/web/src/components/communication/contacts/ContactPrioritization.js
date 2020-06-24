import React, { useState, useEffect, Fragment } from "react";
import {
    ExpansionPanel, ExpansionPanelDetails,
    ExpansionPanelSummary, makeStyles, Button,
    Grid, Typography, Divider, CardActions,
    CardContent, FormControl, Radio, Card,
    RadioGroup, FormControlLabel, FormLabel
} from "@material-ui/core";
import {
    ArrowBack, Save
} from "@material-ui/icons";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { saveUpdatedPrimaryContact } from "../ajax";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";
import { sendWSMessage } from "../../../websocket/communications_ws";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%"
    },
    icons: {
        fontSize: "1.15rem",
        [theme.breakpoints.down("xs")]: {
            fontSize: "1.7rem"
        }
    },
    details: {
        alignItems: "center",
    },
    column: {
        flexBasis: "33.33%",
    },
    helper: {
        borderLeft: `2px solid ${theme.palette.divider}`,
        padding: `${theme.spacing()}px ${theme.spacing(2)}px`,
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline",
        },
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
}));

function createHeader (scope, org_name) {
    let office = "";

    if (scope === 0) office = "community";
    else if (scope === 1) office = "barangay";
    else if (scope === 2) office = "municipal";
    else if (scope === 3) office = "provincial";
    else if (scope === 4) office = "regional";
    else if (scope === 5) office = "national";
    
    const header = `${capitalizeFirstLetter(office)} ${org_name.toUpperCase()}`;
    const offices = `${office}_${org_name}`;

    return {
        header,
        offices
    };
}

function SelectPrimaryContact (props) {
    const {
        checkbox_data,
        updatePrimary,
        contact_per_org,
        setContactsPerOrg,
        contacts_key,
        classes, } = props;
    const [value, setValue] = useState(0);
    const updated_org_primary_contact = [];
    
    useEffect(() => {
        let has_primary = false;
        // eslint-disable-next-line no-shadow
        if (checkbox_data.find(contact => contact.primary_contact === 1)) {
            if ( has_primary === false) {
                has_primary = true;
                const data = checkbox_data.find(contact => contact.primary_contact === 1);
                const u_org_id = data.user_org_id.toString();
                setValue(u_org_id);
            }
        }
    }, []);
    
    const handleChange = event => {
        setValue(event.target.value);
    };

    const savePrimary = () => {
        updatePrimary();
        const selected_value = parseInt(value, 10);
        checkbox_data.forEach((row, index) => {
            let is_primary = 0;
            if (selected_value === row.user_org_id) {
                is_primary = 1;
            }
            // eslint-disable-next-line no-param-reassign
            row.primary_contact = is_primary;
            updated_org_primary_contact.push(row);
        });

        contact_per_org[contacts_key] = updated_org_primary_contact;
        setContactsPerOrg(contact_per_org);
        saveUpdatedPrimaryContact(updated_org_primary_contact, data => {
            sendWSMessage("update_all_contacts");
        });
    };

    return (
        <Fragment>
            <Grid item xs={12} key="contact_radio_button">
                <FormControl component="fieldset" style={{ display: "flex" }}>
                    <FormLabel component="legend" style={{ textAlign: "center", marginBottom: 8 }}>
                        Choose primary contact.
                    </FormLabel>

                    <RadioGroup 
                        aria-label="choose_primary_contact"
                        name="choose_primary_contact"
                        value={value}
                        onChange={handleChange}
                        row
                        style={{ justifyContent: "space-around" }}
                    >
                        {
                            checkbox_data.map((row, index) => {
                                const { contact_person, user_org_id } = row;
                                const { first_name, last_name } = contact_person;
                                
                                return (
                                    <FormControlLabel
                                        value={user_org_id.toString()}
                                        control={<Radio color="primary"/>}
                                        label={`${first_name} ${last_name}`}
                                        key={`contact_radio_button_${index + 1}`}
                                    />
                                );
                            })
                        }
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid item xs={12}><Divider /></Grid>
            <Grid container item xs={12} justify="flex-end">
                <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    className={classes.button}
                    style={{ marginRight: 8 }}
                    startIcon={<Save />}
                    onClick={savePrimary}
                >
                    Save
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={classes.button}
                    startIcon={<ArrowBack />}
                    onClick={() => updatePrimary()}
                >
                    Back
                </Button>
            </Grid>
        </Fragment>
    );
}

function AllContacts (props) {
    const { siteData, classes, isUpdatePrimary, setIsUpdatePrimary } = props;
    const [orgs, setOrgs] = useState([]);
    const [contact_per_org, setContactsPerOrg] = useState({});
    const [checkbox_data, setCheckboxData] = useState([]);
    const [contacts_key, setContactKey] = useState([]);

    useEffect(() => {
        setIsUpdatePrimary(false);
    
        const initial_contact_per_org = {};
        const initial_orgs = [];
        siteData.forEach((row, index) => {
            const { org_name, scope } = row;
            const { offices } = createHeader(scope, org_name);
            const key = initial_contact_per_org[offices];
            if (key === undefined) {
                initial_contact_per_org[offices] = [row];
                initial_orgs.push(offices);
            } else {
                initial_contact_per_org[offices].push(row);
            }
        });
    
        setContactsPerOrg(initial_contact_per_org);
        setOrgs(initial_orgs);
    }, [siteData]);

    const updatePrimary = key => {
        setIsUpdatePrimary(!isUpdatePrimary);
        if (key !== undefined) {
            setCheckboxData(contact_per_org[key]);
            setContactKey(key);
        }
    };

    if (isUpdatePrimary) {
        return (
            <SelectPrimaryContact
                checkbox_data={checkbox_data}
                updatePrimary={updatePrimary}
                contact_per_org={contact_per_org}
                setContactsPerOrg={setContactsPerOrg}
                contacts_key={contacts_key}
                classes={classes}
            />
        );
    }

    return orgs.map((row, index) => {
        const { scope, org_name } = contact_per_org[row][0];
        const { header: contact_scope } = createHeader(scope, org_name);
        const primary_contact = contact_per_org[row].find(x => x.primary_contact === 1);
        let primary = "No primary contact set";
        if (typeof primary_contact !== "undefined") {
            const { contact_person: { first_name, last_name } } = primary_contact;
            primary = `${first_name} ${last_name}`;
        }
        
        return (
            <Grid item xs={12} sm={6} lg={4} align="center" key={`contact_per_org_${index + 1}`}>
                <Card className={classes.root} key={`contact_per_org_card_${index + 1}`}>
                    <CardContent key={`contact_per_org_content_${index + 1}`}>
                        <Typography variant="subtitle2">
                            {contact_scope}
                        </Typography>
                        <Typography variant="body1">{primary}</Typography>
                    </CardContent>
                    <CardActions disableSpacing>
                        <Grid container justify="flex-end">
                            <Button 
                                size="small" color="primary"
                                onClick={() => updatePrimary(row)}
                            >
                                Update
                            </Button>
                        </Grid>
                    </CardActions>
                </Card>
            </Grid>
        );
    });
}

function ContactPrioritization (props) {
    const { siteLabel, siteID, siteData } = props;
    const [ isUpdatePrimary, setIsUpdatePrimary ] = useState(false);
    const classes = useStyles();
    
    return (
        <Fragment key={`site_ID${siteID + 1}`}>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">{siteLabel}</Typography>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails className={classes.details}>
                    <Grid container spacing={3} style={{ marginTop: 6 }}>
                        <AllContacts 
                            siteData={siteData}
                            classes={classes}
                            isUpdatePrimary={isUpdatePrimary}
                            setIsUpdatePrimary={setIsUpdatePrimary}
                        />
                    </Grid>
                </ExpansionPanelDetails>
                <Divider />
            </ExpansionPanel>
        </Fragment>
    );
}

function areStakeHoldersSame (prev, current) {
    return prev.siteData.length === current.siteData.length;
}

export default React.memo(ContactPrioritization, areStakeHoldersSame);
