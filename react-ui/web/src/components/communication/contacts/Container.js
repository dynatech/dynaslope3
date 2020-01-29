import React, {
    Fragment, useState,
    useEffect, useContext,
    createContext
} from "react";

import { withStyles } from "@material-ui/core/styles";
import {
    Button, Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, ListItemSecondaryAction, IconButton,
    Avatar, TextField, Hidden,
    ListItemIcon, Chip,
    Paper, Divider, Slide,
    Backdrop, Tooltip, AppBar,
    Toolbar, Dialog
} from "@material-ui/core";
import { 
    Close, Call, Person, PersonAdd, ViewList,
    Block, Edit, PhoneAndroid, MailOutline,
    Phone, SimCard
} from "@material-ui/icons";

import moment from "moment";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import {
    subscribeToWebSocket, receiveAllContacts,
    removeReceiveAllContacts
} from "../../../websocket/communications_ws";
import { getUserOrganizations, prepareSiteAddress } from "../../../UtilityFunctions";
import ContactList from "./ContactList";
import BlockedContactList from "./BlockedContactList";
import SimPrefixesList from "./SimPrefixesList";
import { SlideTransition } from "../../reusables/TransitionList";
import ContactForm from "./ContactForm";
import { GeneralContext } from "../../contexts/GeneralContext";
import { getBlockedContacts, getSimPrefixes } from "../ajax";

const styles = theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 16
        },
        sticky: {
            position: "sticky",
            top: 146,
            [theme.breakpoints.down("sm")]: {
                top: 48
            },
            backgroundColor: "white",
            // borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            zIndex: 1
        },
        noFlexGrow: { flexGrow: 0 },
        paper: {
            position: "fixed",
            right: 0,
            top: 116,
            height: "100%",
            width: 400
        },
        overflow: {
            overflowY: "auto",
            height: 760,
            [theme.breakpoints.down("md")]: {
                height: 570
            }
        },
        insetDivider: { padding: "8px 70px !important" }
    };
};

function prepareGeographicalList (data, category) {
    let list = [];
    if (category === "municipality") {
        const municipalities = data.map(({ municipality, province }) => ({ id: municipality, label: `${municipality}, ${province}` }));
        list = [...municipalities];
    } else if (["province", "region"].includes(category)) {
        const unique = [...new Set(data.map(x => x[category]).sort())];
        const selection = unique.map(x => ({ id: x, label: x }));
        list = [...selection];
    }

    return list;
}

function IndividualContact (props) {
    const {
        contact, chosenContact, setSlideOpen,
        classes, setContactFormForEdit 
    } = props;
    const site_orgs = getUserOrganizations(chosenContact.user, true);
    const { sites, org } = site_orgs;
    const { user: { landline_numbers, emails } } = chosenContact;

    return (
        <Grid
            container 
            spacing={1} 
            alignItems="center"
            justify="space-evenly"
        >
            <Grid item xs={2}>
                <Avatar>
                    <Person />
                </Avatar>
            </Grid>

            <Grid item xs={7}>
                <Typography variant="h5" align="center">
                    {contact}
                </Typography>
            </Grid>

            <Grid item xs={1} >
                <Hidden smDown lgUp>
                    <IconButton onClick={() => setSlideOpen(false)}>
                        <Close />
                    </IconButton>
                </Hidden>
            </Grid>

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center" paragraph>
                    Affiliation
                </Typography>
            </Grid>

            {
                org !== null ? (
                    <Fragment>
                        <Grid item xs={12} style={{ textAlign: "center" }}>
                            <Chip color="secondary" label={
                                <Typography variant="body1">
                                    { org.toUpperCase() }
                                </Typography>
                            } />
                        </Grid>

                        <Grid item xs={12} style={{ textAlign: "center" }}>
                            {
                                sites.map(site => {
                                    const { site_code } = site;
                                    const address = prepareSiteAddress(site, false);

                                    return (
                                        <Tooltip key={site_code} title={address} aria-label={address}>
                                            <Chip color="primary" label={
                                                <Typography variant="body2">
                                                    { site_code.toUpperCase() }
                                                </Typography>
                                            } />
                                        </Tooltip>
                                    );
                                })
                            }
                        </Grid>
                    </Fragment>
                ) : (
                    <Grid item xs={12}>
                        <Typography color="textSecondary" variant="body2" align="center" paragraph>
                                No affiliations saved
                        </Typography>
                    </Grid>
                )
            }

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Contact Information
                </Typography>
            </Grid>

            <Grid item xs={12} className={classes.insetDivider} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle1" align="center">
                    Mobile
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <List dense>
                    {
                        chosenContact.mobile_numbers.map(num => (
                            <ListItem key={num.mobile_id}>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PhoneAndroid />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`+${num.sim_num}`}
                                    // secondary={`Priority: ${num.priority}`}
                                />
                                <ListItemSecondaryAction>
                                    {/* <IconButton edge="end" aria-label="delete">
                                        <DeleteIcon />
                                    </IconButton> */}
                                    <ListItemText
                                        secondary={`Status: ${num.status === 0 ? "Inactive" : "Active"}`}
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))
                    }
                </List>
            </Grid>

            <Grid item xs={12} className={classes.insetDivider} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle1" align="center">
                    Landline
                </Typography>
            </Grid>

            <Grid item xs={12}>
                {
                    landline_numbers.length === 0 ? (
                        <Grid item xs={12}>
                            <Typography color="textSecondary" variant="body2" align="center">
                                No landline numbers saved
                            </Typography>
                        </Grid>
                    ) : (
                        <List dense>
                            {
                                landline_numbers.map(num => (
                                    <ListItem key={num.landline_id}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <Call />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`+${num.landline_num}`}
                                        />
                                        {/* <ListItemSecondaryAction>
                                    <ListItemText
                                        secondary={`Priority: ${num.priority}`}
                                    />
                                </ListItemSecondaryAction> */}
                                    </ListItem>
                                ))
                            }
                        </List>
                    )
                }
            </Grid>

            <Grid item xs={12} className={classes.insetDivider} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="subtitle1" align="center">
                    Email
                </Typography>
            </Grid>

            <Grid item xs={12}>
                {
                    emails.length === 0 ? (
                        <Grid item xs={12}>
                            <Typography color="textSecondary" variant="body2" align="center">
                                No email addresses saved
                            </Typography>
                        </Grid>
                    ) : (
                        <List dense>
                            {
                                emails.map(row => (
                                    <ListItem key={row.email_id}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <MailOutline />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`+${row.email}`}
                                        />
                                    </ListItem>
                                ))
                            }
                        </List>
                    )
                }
            </Grid>

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    color="secondary" 
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setContactFormForEdit(true)}
                >
                    Edit
                </Button>
            </Grid>
        </Grid>
    );
}

function BlockedContact (props) {
    const { chosenContact } = props;
    if (chosenContact.length === 0) {
        return (
            <Grid
                container 
                spacing={1} 
                alignItems="center"
                justify="space-evenly"
            >
                <Grid item xs={7}>
                    <Typography variant="caption" display="block">
                        No initial blocked contact
                    </Typography>
                </Grid>
            </Grid>
        );
    }

    const { mobile_number, reporter, ts, reason } = chosenContact;
    const { sim_num, user_details } = mobile_number;
    const { first_name: reporter_first_name, last_name: reporter_last_name } = reporter;
    let contact_name = "No contact details";
    if (user_details !== null) {
        const { user: { first_name, last_name } } = user_details;
        contact_name = `${last_name}, ${first_name}`;
    }
    const date_reported = moment(ts).format("MMMM D, YYYY, HH:mm:ss");
    return (
        <Grid
            container 
            spacing={1} 
            alignItems="center"
            justify="space-evenly"
        >
            <Grid item xs={1}>
                <Avatar>
                    <Phone />
                </Avatar>
            </Grid>

            <Grid item xs={7}>
                <Typography variant="h5" align="center">
                    {`+${sim_num}`}
                </Typography>
            </Grid>

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Details
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    {contact_name}
                </Typography>
            </Grid>

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Reason
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body2" align="center">
                    <i>{reason}</i>
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body2" align="center">
                    {date_reported}
                </Typography>
            </Grid>

            {/* <Grid item xs={12}>
                <Typography variant="subtitle1">
                    Reason:
                </Typography>
                <Typography variant="caption" display="block" gutterBottom>
                    {`${reason}`}
                </Typography>
                <Typography color="textSecondary" variant="caption" paragraph>
                    {`Date reported: ${date_reported}`}
                </Typography>
            </Grid> */}

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    Reporter
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    {`${reporter_last_name}, ${reporter_first_name}`}
                </Typography>
            </Grid>

            <Grid item xs={12} style={{ padding: "12px 4px" }} >
                <Divider />
            </Grid>

            <Grid item xs={12} style={{ textAlign: "right" }}>
                <Button 
                    color="secondary" 
                    variant="contained"
                    startIcon={<PersonAdd />}
                >
                    Unblock
                </Button>
            </Grid>
        </Grid>
    );
}

const SearchBar = ({ search_str, setSearchStr }) => (
    <TextField
        margin="dense"
        hiddenLabel
        fullWidth
        variant="outlined"
        placeholder="Search"
        inputProps={{ "aria-label": "search" }}
        value={search_str}
        onChange={event => setSearchStr(event.target.value)}
    />
);

function Container (props) {
    const { classes } = props;
    const [contacts, setContacts] = useState([]);
    const [contacts_array, setContactsArray] = useState([]);
    const [chosen_contact, setChosenContact] = useState({});
    const [is_slide_open, setSlideOpen] = useState(false);
    const [is_contact_form_open, setContactFormOpen] = useState(false);
    const [is_block_numbers_open, setOpenBlockedNumbers] = useState(false);
    const [is_sim_prefixes_open, setOpenSimPrefixes] = useState(false);
    const [is_edit_mode, setEditMode] = useState(false);
    const [search_str, setSearchStr] = useState("");
    const [ blocked_number_array, setBlockedNumberArray ] = useState([]);
    const [ blocked_chosen_contact, setBlockedChosenContact ] = useState([]);
    const [ sim_prefixes_list, setSimPrefixesList ] = useState([]);

    const [municipalities, setMunicipalities] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [regions, setRegions] = useState([]);

    const onContactClickFn = React.useCallback(row => () => {
        setChosenContact(row);
        setSlideOpen(true);
    }, []);

    const onBlockContactClickFn = React.useCallback(row => () => {
        setBlockedChosenContact(row);
        setSlideOpen(true);
    }, []);

    const setContactForm = bool => {
        setSlideOpen(bool);
        setContactFormOpen(bool);
        setEditMode(false);
    };

    const setContactFormForEdit = bool => {
        setEditMode(bool);
        setContactFormOpen(bool);
    };

    const onShowBlockedNumbers = () => {
        if (is_block_numbers_open) {
            setOpenBlockedNumbers(false);
            setOpenSimPrefixes(false);
        } else { 
            setOpenBlockedNumbers(true);
            setOpenSimPrefixes(false);
        }
    };

    const onShowSimPrefixes = () => {
        if (is_sim_prefixes_open) {
            setOpenSimPrefixes(false);
            setOpenBlockedNumbers(true);
        } else { 
            setOpenSimPrefixes(true); 
            setOpenBlockedNumbers(false);
        }
    };

    const { setIsReconnecting, sites } = useContext(GeneralContext);
    useEffect(() => {
        subscribeToWebSocket("contacts", setIsReconnecting);

        receiveAllContacts(data => {
            setContacts(data);
            if (data.length > 0) setChosenContact(data[0]);
            setContactsArray(data);
        });

        return () => removeReceiveAllContacts();
    }, []);

    useEffect(() => {
        setMunicipalities(prepareGeographicalList(sites, "municipality"));
        setProvinces(prepareGeographicalList(sites, "province"));
        setRegions(prepareGeographicalList(sites, "region"));
    }, [sites]);

    useEffect(() => {
        const filtered = contacts.filter(row => {
            const { user: { first_name, last_name } } = row;
            const name = `${first_name} ${last_name}`;
            const pattern = new RegExp(`${search_str}`, "gi");
            return pattern.test(name);
        });
        setContactsArray(filtered);
    }, [search_str]);

    useEffect(() => {
        getBlockedContacts(data => {
            const { status, blocked_numbers } = data;
            if (status) {
                setBlockedNumberArray(blocked_numbers);
                if (blocked_numbers.length !== 0) {
                    setBlockedChosenContact(blocked_numbers[0]);
                }
            }
        });

        getSimPrefixes(data => {
            const { status, prefixes } = data;
            if (status) {
                setSimPrefixesList(prefixes);
            }
        });
    }, []);

    
    let contact = "";
    // eslint-disable-next-line no-prototype-builtins
    if (chosen_contact.hasOwnProperty("user")) {
        const { user } = chosen_contact;
        const { first_name, last_name } = user;
        contact = `${first_name} ${last_name}`;
    }

    const PaperDialogContent = is_form_open => {
        if (is_form_open) return (
            <ContactForm 
                municipalities={municipalities}
                provinces={provinces}
                regions={regions}
                setContactForm={setContactForm}
                chosenContact={chosen_contact}
                isEditMode={is_edit_mode}
                setContactFormForEdit={setContactFormForEdit}
                isFromChatterbox={false}
            /> 
        );

        if (is_block_numbers_open) {
            return (
                <BlockedContact
                    chosenContact={blocked_chosen_contact}
                />
            );
        }

        return (
            <IndividualContact 
                contact={contact}
                chosenContact={chosen_contact}
                setSlideOpen={setSlideOpen}
                classes={classes}
                setContactFormForEdit={setContactFormForEdit}
            />
        );
    };
    
    const ListContent = () => {
        if (is_sim_prefixes_open) {
            return (
                <SimPrefixesList
                    sim_prefixes={sim_prefixes_list}
                />
            );
        }

        if (is_block_numbers_open) {
            return (
                <BlockedContactList
                    blocked_numbers={blocked_number_array}
                    onBlockContactClickFn={onBlockContactClickFn}
                />
            );
        }
        
        return ( <ContactList 
            {...props} 
            contacts={contacts_array}
            onContactClickFn={onContactClickFn}
            showBlockedNumbers={is_block_numbers_open}
        />);
    };
    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | Contacts" 
            />

            <Grid container spacing={4}>
                <Hidden mdUp>
                    <Grid item xs={12} className={classes.sticky} style={{ paddingBottom: 0 }}>
                        { <SearchBar search_str={search_str} setSearchStr={setSearchStr} /> }
                    </Grid>
                </Hidden>

                <Hidden smDown>
                    <Grid item md={4} lg={3}>
                        <div className={classes.sticky}>
                            { <SearchBar search_str={search_str} setSearchStr={setSearchStr} /> }
                            <List component="nav" aria-label="main">
                                <ListItem button onClick={() => setContactForm(true)}>
                                    <ListItemIcon>
                                        <PersonAdd />
                                    </ListItemIcon>
                                    <ListItemText primary="Add contact" />
                                </ListItem>
                                <ListItem button onClick={() => onShowBlockedNumbers(true)}>
                                    <ListItemIcon>
                                        {
                                            is_block_numbers_open ? (
                                                <ViewList/>
                                            ) : (
                                                <Block/>
                                            )
                                        }
                                    </ListItemIcon>
                                    {
                                        is_block_numbers_open ? (
                                            <ListItemText primary="Show active numbers" />
                                        ) : (
                                            <ListItemText primary="Show blocked numbers" />
                                        )
                                    }
                                </ListItem>
                                <ListItem button onClick={() => onShowSimPrefixes(true)}>
                                    <ListItemIcon>
                                        <SimCard />
                                    </ListItemIcon>
                                    <ListItemText primary="Sim Prefixes" />
                                </ListItem>
                                {/* <ListItem button>
                                    <ListItemIcon>
                                        <Block />
                                    </ListItemIcon>
                                    <ListItemText primary="Arrange " />
                                </ListItem> */}
                            </List>
                        </div>
                    </Grid>
                </Hidden>

                <Grid item xs={12} md={8} lg={5}>
                    {ListContent()}
                    {/* {
                        is_sim_prefixes_open ? (
                            <SimPrefixesList
                                sim_prefixes={sim_prefixes_list}
                            />
                        ) : (<div />)
                    }

                    {
                        is_block_numbers_open ? (
                            <BlockedContactList
                                blocked_numbers={blocked_number_array}
                                onBlockContactClickFn={onBlockContactClickFn}
                            />
                        ) : (
                            <ContactList 
                                {...props} 
                                contacts={contacts_array}
                                onContactClickFn={onContactClickFn}
                                showBlockedNumbers={is_block_numbers_open}
                            />
                        )
                    } */}
                </Grid>
                
                <Hidden mdDown>
                    <Grid item lg={4}>
                        {
                            contact !== "" && (
                                <Paper 
                                    elevation={1}
                                    style={{ padding: 16, zIndex: 2 }}
                                    className={`${classes.sticky} ${is_contact_form_open && classes.overflow}`}
                                >
                                    { PaperDialogContent(is_contact_form_open) }
                                </Paper>
                            )
                        }
                    </Grid>

                    <Backdrop open={is_contact_form_open} style={{ zIndex: 1 }} />
                </Hidden>

                <Hidden smDown lgUp>
                    <Slide direction="left" in={is_slide_open} mountOnEnter unmountOnExit>
                        <Paper 
                            elevation={4}
                            className={`${classes.paper} ${classes.overflow}`}
                            style={{ padding: 24, zIndex: 2 }}
                        >
                            { PaperDialogContent(is_contact_form_open) }
                        </Paper>
                    </Slide>
                        
                    <Backdrop open={is_slide_open} style={{ zIndex: 1 }} />
                </Hidden>
                
                <Hidden mdUp>
                    <Dialog 
                        fullScreen
                        open={is_slide_open}
                        TransitionComponent={SlideTransition}
                    >
                        <AppBar style={{ position: "relative" }}>
                            <Toolbar>
                                <IconButton edge="start" color="inherit" onClick={() => setContactForm(false)} aria-label="close">
                                    <Close />
                                </IconButton>
                            </Toolbar>
                        </AppBar>
                        <Paper elevation={0} style={{ padding: 16 }}>
                            { PaperDialogContent(is_contact_form_open) }
                        </Paper>
                    </Dialog>
                </Hidden>
            </Grid>
        </div>
    );
}

export default withStyles(styles)(Container);
