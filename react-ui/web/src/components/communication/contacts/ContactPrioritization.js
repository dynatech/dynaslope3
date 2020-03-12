import React, { useState, useEffect, Fragment } from "react";
import {
    ExpansionPanel, ExpansionPanelDetails,
    ExpansionPanelSummary, makeStyles, Button,
    Grid, Typography, Divider, CardActions,
    CardContent, FormControl, Radio, Card,
    RadioGroup, FormControlLabel, FormLabel
} from "@material-ui/core";
import {
    Refresh, SaveAlt, Send, ArrowBack, Save
} from "@material-ui/icons";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { savePrimaryContact, saveUpdatedPrimaryContact } from "../ajax";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
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
    let header = "";
    let offices = "";
    if (scope === 0) {
        header = `Community ${org_name.toUpperCase()}`;
        offices = `community_${org_name}`;
    } else if (scope === 1) {
        header = `Barangay ${org_name.toUpperCase()}`;
        offices = `barangay_${org_name}`;
    } else if (scope === 2) {
        header = `Municipal ${org_name.toUpperCase()}`;
        offices = `municipal_${org_name}`;
    } else if (scope === 3) {
        header = `Provincial ${org_name.toUpperCase()}`;
        offices = `provincial_${org_name}`;
    } else if (scope === 4) {
        header = `Regional ${org_name.toUpperCase()}`;
        offices = `regional_${org_name}`;
    } else if (scope === 5) {
        header = `National ${org_name.toUpperCase()}`;
        offices = `national_${org_name}`;
    }


    return {
        header,
        offices
    };
}

function SelectPrimaryContact ( props ) {
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
        // eslint-disable-next-line radix
        const selected_value = parseInt(value);
        checkbox_data.forEach((row, index) => {
            if (selected_value === row.user_org_id) {
                // eslint-disable-next-line no-param-reassign
                row.primary_contact = 1;
            } else {
                // eslint-disable-next-line no-param-reassign
                row.primary_contact = 0;
            }
            updated_org_primary_contact.push(row);
        });
        contact_per_org[contacts_key] = updated_org_primary_contact;
        setContactsPerOrg(contact_per_org);
        saveUpdatedPrimaryContact(updated_org_primary_contact, data => {
        });
    };

    return (
        <Fragment>
            <Grid item xs={12} key="back_button">
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
            
            <Grid item xs={12} key="contact_radio_button">
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">Choose primary contact.</FormLabel>
                    <RadioGroup 
                        aria-label="choose_primary_contact"
                        name="choose_primary_contact"
                        value={value}
                        onChange={handleChange}
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
                                        key={`contact_radio_button_${index + 1}`} />
                                );
                            })
                        }
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid item xs={12} key="contact_save_button">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={classes.button}
                    startIcon={<Save />}
                    onClick={savePrimary}
                >
                    Save
                </Button>
            </Grid>
        </Fragment>
    );
}

function AllContacts (props) {
    const { site_data, classes, isUpdatePrimary, setIsUpdatePrimary } = props;
    const initial_contact_per_org = {};
    const orgs = [];
    const [contact_per_org, setContactsPerOrg] = useState(initial_contact_per_org);
    const [checkbox_data, setCheckboxData] = useState([]);
    const [contacts_key, setContactKey] = useState([]);
   
    
    site_data.forEach((row, index) => {
        const { org_name, contact_person, scope, primary_contact, user_org_id } = row;
        const { offices } = createHeader(scope, org_name);
        const key = initial_contact_per_org[offices];
        if (key === undefined) {
            initial_contact_per_org[offices] = [{ org_name, contact_person, scope, primary_contact, user_org_id }];
            orgs.push(offices);
        } else {
            initial_contact_per_org[offices].push({ org_name, contact_person, scope, primary_contact, user_org_id });
        }
    });

    useEffect(() => {
        setContactsPerOrg(initial_contact_per_org);
    }, []);

    const updatePrimary = (key) => {
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
        let contact_scope = null;

        let primary_contacts = [];
        contact_per_org[row].map((contact) => {
            const { org_name, contact_person, scope, primary_contact } = contact;
            const { header } = createHeader(scope, org_name);
            contact_scope = header;
            const { first_name, last_name } = contact_person;
            if (primary_contact === 1) {
                primary_contacts.push(<Typography variant="body2" align="center" key={`${first_name}_${last_name}_${index + 1}`}>
                    {first_name} {last_name}
                </Typography>);
            }
            return primary_contacts;
        });

        if (primary_contacts.length === 0) {
            primary_contacts = <Typography variant="body2" align="center">No primary contact.</Typography>;
        }
        
        return (
            
            <Grid item xs={4} align="center" key={`contact_per_org_${index + 1}`}>
                <Card className={classes.root} key={`contact_per_org_card_${index + 1}`}>
                    <CardContent key={`contact_per_org_content_${index + 1}`}>
                        <Typography variant="h6" component="h2">
                            {contact_scope}
                        </Typography>
                        {primary_contacts}
                    </CardContent>
                    <CardActions>
                        <Button size="small" color="primary" onClick={() => updatePrimary(row)}>Update Primary</Button>
                    </CardActions>
                </Card>
            </Grid>
        );
    });
}

function ContactPrioritization (props) {
    const { site_label, site_id, site_data } = props;
    const [ isUpdatePrimary, setIsUpdatePrimary ] = useState(false);
    const classes = useStyles();
    return (
        <Fragment key={`site_id_${site_id + 1}`}>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">{site_label}</Typography>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails className={classes.details}>
                    <Grid container spacing={3}>
                        <AllContacts 
                            site_data={site_data}
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

export default ContactPrioritization;