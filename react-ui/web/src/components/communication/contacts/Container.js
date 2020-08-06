import React, {
    Fragment, useState,
    useEffect, useContext
} from "react";

import {
    Button, Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, ListItemSecondaryAction, IconButton,
    Avatar, TextField, Hidden,
    ListItemIcon, Chip,
    Paper, Divider, Slide, 
    Backdrop, Tooltip, AppBar, InputAdornment,
    Toolbar, Dialog, Collapse,
    makeStyles
} from "@material-ui/core";
import { 
    Close, Call, Person, PersonAdd, ViewList,
    Block, Edit, PhoneAndroid, MailOutline,
    Phone, SimCard, FormatListNumbered,
    Sort, Star
} from "@material-ui/icons";

import moment from "moment";
import ContentLoader from "react-content-loader";
import { useSnackbar } from "notistack";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import {
    subscribeToWebSocket, receiveAllContacts,
    removeReceiveAllContacts
} from "../../../websocket/communications_ws";
import {
    getUserOrganizations, prepareSiteAddress,
    getUserContactPriority
} from "../../../UtilityFunctions";
import ContactList from "./ContactList";
import BlockedContactList from "./BlockedContactList";
import SimPrefixesList from "./SimPrefixesList";
import ContactPrioritization from "./ContactPrioritization";
import { SlideTransition } from "../../reusables/TransitionList";
import ContactForm from "./ContactForm";
import { GeneralContext } from "../../contexts/GeneralContext";
import { getBlockedContacts, getSimPrefixes, getSiteStakeHolders } from "../ajax";
import SearchContactsModal from "./SearchContactsModal";

const useStyles = makeStyles(theme => {
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
            zIndex: 1
        },
        noFlexGrow: { flexGrow: 0 },
        paper: {
            position: "fixed",
            right: 0,
            top: 116,
            width: 400
        },
        overflow: {
            overflowY: "auto",
            height: "calc(100vh - 250px)",
            [theme.breakpoints.down("md")]: {
                height: "80vh"
            }
        },
        insetDivider: { padding: "8px 70px !important" },
        nested: { paddingLeft: theme.spacing(4) },
        hidden: { display: "none !important" }
    };

});

const Loader = props => (
    <ContentLoader
        speed={2}
        width={700}
        height={350}
        viewBox="0 0 700 350"
        {...props}
    >
        <rect x="4" y="8" rx="3" ry="3" width="8" height="317" />
        <rect x="7" y="317" rx="3" ry="3" width="669" height="8" />
        <rect x="669" y="9" rx="3" ry="3" width="7" height="313" />
        <rect x="5" y="8" rx="3" ry="3" width="669" height="7" />
        <rect x="114" y="52" rx="6" ry="6" width="483" height="15" />
        <circle cx="77" cy="60" r="15" />
        <rect x="116" y="105" rx="6" ry="6" width="420" height="15" />
        <circle cx="78" cy="113" r="15" />
        <rect x="115" y="158" rx="6" ry="6" width="483" height="15" />
        <circle cx="78" cy="166" r="15" />
        <rect x="117" y="211" rx="6" ry="6" width="444" height="15" />
        <circle cx="79" cy="219" r="15" />
        <rect x="117" y="263" rx="6" ry="6" width="483" height="15" />
        <circle cx="80" cy="271" r="15" />
    </ContentLoader>
);
  

function IndividualContact (props) {
    const {
        contact, chosenContact, setSlideOpen,
        classes, setContactFormForEdit, siteOrgs,
        isContactPriority
    } = props;
    
    const { sites, org } = siteOrgs;
    const {
        status, emails, ewi_recipient,
        landline_numbers, mobile_numbers,
        ewi_restriction
    } = chosenContact;

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
                        <Grid item xs={12} container justify="center">
                            <Tooltip 
                                arrow
                                disableFocusListener 
                                disableHoverListener={!isContactPriority}
                                title="Contact Priority"
                                placement="top"
                            >
                                <Chip 
                                    color="secondary"
                                    label={
                                        <Typography variant="body1">
                                            { org.toUpperCase() }
                                        </Typography>
                                    }
                                    icon={isContactPriority ? <Star style={{ color: "gold" }} /> : null}
                                />
                            </Tooltip>
                        </Grid>

                        <Grid item xs={12} container justify="center">
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

            <Grid item xs={12} className={classes.insetDivider} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    <strong>Status</strong>
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body2" align="center">
                    { status === 0 ? "Inactive" : "Active" }
                </Typography>
            </Grid>

            <Grid item xs={12} className={classes.insetDivider} >
                <Divider />
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body1" align="center">
                    <strong>EWI Recipient</strong>
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="body2" align="center">
                    { ewi_recipient === 0 ? "No" : "Yes" }
                </Typography>
            </Grid>

            {
                ewi_restriction && (
                    <Fragment>
                        <Grid item xs={12} className={classes.insetDivider} >
                            <Divider />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body1" align="center">
                                <strong>EWI Restriction</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" align="center">
                                Do not send on Alert {ewi_restriction.alert_level} { ewi_restriction.alert_level > 1 && "and below" }
                            </Typography>
                        </Grid>
                    </Fragment>
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
                        mobile_numbers.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography color="textSecondary" variant="body2" align="center">
                                    No mobile numbers saved
                                </Typography>
                            </Grid>
                        ) : (
                            mobile_numbers.map(num => (
                                <ListItem key={num.mobile_number.mobile_id}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <PhoneAndroid />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={`+${num.mobile_number.sim_num}`}
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
                        )
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
    const { chosenContact, setSlideOpen } = props;
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
                    disabled
                >
                    Unblock (soon)
                </Button>
            </Grid>
        </Grid>
    );
}

const SearchBar = ({ search_str, setSearchStr, inputProps }) => (
    <TextField  
        margin="dense"
        hiddenLabel 
        fullWidth
        variant="outlined"
        placeholder="Type contact name"
        InputProps={inputProps}
        value={search_str}
        onChange={event => setSearchStr(event.target.value)}  
    /> 
);

function Container (props) {
    const classes = useStyles();
    
    const [contacts, setContacts] = useState([]);
    const [contacts_array, setContactsArray] = useState([]);
    const [chosen_contact, setChosenContact] = useState({});
    const [chosen_contact_index, setChosenContactIndex] = useState(0);

    const [is_slide_open, setSlideOpen] = useState(false);
    const [is_contact_form_open, setContactFormOpen] = useState(false);
    const [is_edit_mode, setEditMode] = useState(false);
    const [search_str, setSearchStr] = useState("");

    const [blocked_number_array, setBlockedNumberArray] = useState([]);
    const [blocked_chosen_contact, setBlockedChosenContact] = useState([]);
    const [sim_prefixes_list, setSimPrefixesList] = useState([]);
    const [site_stakeholders, setSiteStakeholders] = useState([]);

    const [tab_selected, setTabSelected] = useState("active_numbers");
    const [snackbar_key, setSnackbarKey] = useState(null);

    const [modal_state, setModalState] = useState(false);
    const onContactClickFn = React.useCallback((row, index) => () => {
        setChosenContact(row);
        setChosenContactIndex(index);
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

    const selectedTab = key => {
        setTabSelected(key);
    };

    const modal_handler = (event) =>{   
        setModalState(!modal_state);
    };

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { setIsReconnecting, sites } = useContext(GeneralContext);
    const [get_contact_priotitization, setGetContactPrioritization] = useState(false);
    useEffect(() => {
        subscribeToWebSocket(setIsReconnecting, "contacts");
        receiveAllContacts(data => {
            setContacts(data);

            let temp = {};
            if (data.length > 0) temp = data[chosen_contact_index];

            setChosenContact(temp);
            setContactsArray(data);
            setGetContactPrioritization(true);

            if (snackbar_key !== null) {
                closeSnackbar(snackbar_key);
                setSnackbarKey(null);
                enqueueSnackbar(
                    "Loading contacts list successful!",
                    { variant: "success", autoHideDuration: 5000 }
                );
            }
        });

        return () => removeReceiveAllContacts();
    }, [chosen_contact_index, snackbar_key]);

    useEffect(() => {
        const { length } = search_str;
        if (length > 2 ) {
            const filtered = contacts.filter(row => {
                const { first_name, last_name } = row;
                const name = `${first_name} ${last_name}`;
                const pattern = new RegExp(`${search_str}`, "gi");
                return pattern.test(name);          
            });
            setContactsArray(filtered);
        } else if (length === 0) setContactsArray(contacts);
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

    useEffect(() => {
        if (get_contact_priotitization) {
            getSiteStakeHolders(data => {
                setSiteStakeholders(data);
            });
            setGetContactPrioritization(false);
        }
    }, [get_contact_priotitization]);

    let contact = "";
    let site_orgs = null;
    let is_priority = false;
    // eslint-disable-next-line no-prototype-builtins
    if (chosen_contact.hasOwnProperty("user_id")) {
        const { first_name, last_name, organizations } = chosen_contact;
        contact = `${first_name} ${last_name}`;
        site_orgs = getUserOrganizations(organizations, true);
        is_priority = getUserContactPriority(organizations);
    }

    const set_modal_fn = (key, bool) => () => {
        setModalState(bool);
    };

    const PaperDialogContent = () => {
        if (is_contact_form_open) return (
            <ContactForm
                setContactForm={setContactForm}
                chosenContact={chosen_contact}
                setSnackbarKey={setSnackbarKey}
                isEditMode={is_edit_mode}
                setContactFormForEdit={setContactFormForEdit}
                isFromChatterbox={false}
            /> 
        );
        
        if (contact !== "") {
            return (
                <IndividualContact 
                    contact={contact}
                    chosenContact={chosen_contact}
                    setSlideOpen={setSlideOpen}
                    classes={classes}
                    setContactFormForEdit={setContactFormForEdit}
                    siteOrgs={site_orgs}
                    isContactPriority={is_priority}
                />
            );
        }
    };

    const SearchComp = <SearchBar search_str={search_str} setSearchStr={setSearchStr}
        inputProps={{ 
            endAdornment: <InputAdornment position="end">
                <IconButton  
                    aria-controls="sortContacts" 
                    aria-haspopup="true" 
                    onClick={modal_handler} 
                    color="primary">
                    <Sort/> 
                </IconButton>                  
            </InputAdornment> 
        }}
    />;
    
    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | Contacts" 
            />
            <Grid container spacing={4}>
                <Hidden mdUp>
                    <Grid item xs={12} className={classes.sticky} style={{ paddingBottom: 0 }}>
                        {SearchComp}
                    </Grid>
                </Hidden>

                <Hidden smDown>
                    <Grid item md={4} lg={3}>
                        <div className={classes.sticky}>
                            {SearchComp}
                          
                            <List component="nav" aria-label="main">
                                <ListItem 
                                    button
                                    onClick={() => selectedTab("active_numbers")}
                                    selected={tab_selected === "active_numbers"}
                                >
                                    <ListItemIcon>
                                        <ViewList />
                                    </ListItemIcon>
                                    <ListItemText primary="Active Contacts" />
                                </ListItem>

                                <Collapse in={tab_selected === "active_numbers"} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem 
                                            button 
                                            onClick={() => setContactForm(true)}
                                            className={classes.nested}
                                        >
                                            <ListItemIcon>
                                                <PersonAdd />
                                            </ListItemIcon>
                                            <ListItemText primary="Add Contact" />
                                        </ListItem>
                                    </List>
                                </Collapse>

                                <ListItem 
                                    button 
                                    onClick={() => selectedTab("blocked_numbers")}
                                    selected={tab_selected === "blocked_numbers"}
                                >
                                    <ListItemIcon>
                                        <Block />
                                    </ListItemIcon>
                                    <ListItemText primary="Blocked Contacts" />
                                </ListItem>

                                <ListItem
                                    button
                                    onClick={() => selectedTab("contact_prioritization")}
                                    selected={tab_selected === "contact_prioritization"}
                                >
                                    <ListItemIcon>
                                        <FormatListNumbered />
                                    </ListItemIcon>
                                    <ListItemText primary="Contact Prioritization" />
                                </ListItem>

                                <ListItem
                                    button
                                    onClick={() => selectedTab("sim_prefixes")}
                                    selected={tab_selected === "sim_prefixes"}
                                >
                                    <ListItemIcon>
                                        <SimCard />
                                    </ListItemIcon>
                                    <ListItemText primary="SIM Prefixes" />
                                </ListItem>
                            </List>
                        </div>
                    </Grid>
                </Hidden>

                <Grid item xs={12} md={8} lg={9}>
                    {
                        contacts.length === 0
                            ? <div style={{ width: "100%" }}><Loader /></div>
                            : (
                                <Fragment>
                                    <Hidden xsUp={tab_selected !== "active_numbers"} implementation="css">
                                        <Grid container spacing={4}>
                                            <Grid item xs={12} lg={7}>
                                                <ContactList 
                                                    classes={classes}
                                                    contacts={contacts_array}
                                                    onContactClickFn={onContactClickFn}
                                                />
                                            </Grid>
                            
                                            <Hidden mdDown>
                                                <Grid item lg={5}>
                                                    {
                                                        contact !== "" && (
                                                            <Paper 
                                                                elevation={1}
                                                                style={{ padding: 16, zIndex: 2 }}
                                                                className={`${classes.sticky} ${classes.overflow}`}
                                                                variant="outlined"
                                                            >
                                                                { PaperDialogContent() }
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
                                                        { PaperDialogContent() }
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
                                                        { PaperDialogContent() }
                                                    </Paper>
                                                </Dialog>
                                            </Hidden>
                                        </Grid>
                                    </Hidden>
        
                                    <Hidden xsUp={tab_selected !== "blocked_numbers"} implementation="css">
                                        <Grid container spacing={4}>
                                            <Grid item xs={12} lg={7}>
                                                <BlockedContactList
                                                    blocked_numbers={blocked_number_array}
                                                    onBlockContactClickFn={onBlockContactClickFn}
                                                />
                                            </Grid>

                                            <Hidden mdDown>
                                                <Grid item lg={5}>
                                                    <Paper 
                                                        elevation={1}
                                                        style={{ padding: 16, zIndex: 2 }}
                                                        className={classes.sticky}
                                                        variant="outlined"
                                                    >
                                                        <BlockedContact
                                                            chosenContact={blocked_chosen_contact}
                                                            setSlideOpen={setSlideOpen}
                                                        />
                                                    </Paper>
                                                </Grid>
                                            </Hidden>

                                            <Hidden smDown lgUp>
                                                <Slide direction="left" in={is_slide_open} mountOnEnter unmountOnExit>
                                                    <Paper 
                                                        elevation={4}
                                                        className={`${classes.paper} ${classes.overflow}`}
                                                        style={{ padding: 24, zIndex: 2 }}
                                                    >
                                                        <BlockedContact
                                                            chosenContact={blocked_chosen_contact}
                                                            setSlideOpen={setSlideOpen}
                                                        />
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
                                                        <BlockedContact
                                                            chosenContact={blocked_chosen_contact}
                                                            setSlideOpen={setSlideOpen}
                                                        />
                                                    </Paper>
                                                </Dialog>
                                            </Hidden>
                                        </Grid>
                                    </Hidden>

                                    <Hidden xsUp={tab_selected !== "contact_prioritization"} implementation="css">
                                        <Typography variant="body1" style={{ marginBottom: 12 }}>
                                            <strong><i>
                                                Note: Contact priority can only be chosen from stakeholders that are currently active and EWI recipients.
                                            </i></strong>
                                        </Typography>
                        
                                        {
                                            site_stakeholders.length !== 0 && (
                                                sites.map((row, index) => {
                                                    const { site_id, site_code } = row;
                                                    const site_label = prepareSiteAddress(row, true, "start");
                                                    const site_data = site_stakeholders[site_code];
                                    
                                                    return (
                                                        <ContactPrioritization
                                                            siteLabel={site_label}
                                                            siteID={site_id}
                                                            siteData={site_data}
                                                            key={index}
                                                        />
                                                    );
                                                })
                                            )
                                        }
                                    </Hidden>

                                    <Hidden xsUp={tab_selected !== "sim_prefixes"} implementation="css">
                                        <SimPrefixesList
                                            sim_prefixes={sim_prefixes_list}
                                        />
                                    </Hidden>
                                </Fragment>
                            )
                    }
                </Grid>
            </Grid>

            <SearchContactsModal
                modalStateHandler={set_modal_fn("search", false)}
                modalState={modal_state}
                contactsArray = {contacts_array}
                classes = {classes}
                chosenContact = {chosen_contact}
                setChosenContact= {setChosenContact}
            />
        </div>
    );
}

export default Container;
