import React, { Fragment } from "react";
import { Link } from "react-router-dom";

import {
    List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Grid, 
    Chip, Typography, makeStyles,
    IconButton, Paper
} from "@material-ui/core";
import { isWidthUp } from "@material-ui/core/withWidth";
import {
    CallReceived, CallMade, MoreVert,
    Cancel, RadioButtonUnchecked, CheckCircle,
    MobileOff
} from "@material-ui/icons";

import moment from "moment";

import GenericAvatar from "../../../images/generic-user-icon.jpg";
import { getUserOrganizations, simNumFormatter } from "../../../UtilityFunctions";
import OptionsModal from "./OptionsModal";
import BlockNumberModal from "./BlockNumberModal";
import SaveContactModal from "./SaveContactModal";

const useStyles = makeStyles(theme => ({
    inline: {
        display: "inline",
    },
    overflowEllipsis: {
        fontSize: "inherit",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden"
    },
    link: { textDecoration: "none" },
    noFlexGrow: { flexGrow: 0 },
    hidden: { display: "none !important" },
    sentIcon: { fontSize: "1.10rem" }
}));

export function mobileUserFormatter (users, first_message) {
    const sender_arr = [];
    let orgs_arr = [];
    users.forEach(row => {
        const { user, status } = row;
        const { first_name, last_name, organizations } = user;
        const sender = `${first_name} ${last_name}`;
        const orgs = getUserOrganizations(organizations);
        if (users.length === 1) orgs_arr = [...orgs];
        let org = sender;
        let level = null;
        if (orgs.length > 0) {
            org = `${orgs[0].toUpperCase()}: ${orgs.slice(1).join(", ")}`;
            level = orgs[0];
        }
        
        sender_arr.push({ sender, org, level, inactive: !status });
    });

    return { sender_arr, orgs_arr };
}

function returnTS (ts_received) {
    const moment_ts = moment(ts_received);
    const is_today = moment_ts.isSame(moment(), "day");
    const ts = is_today ? moment_ts.format("HH:mm") : moment_ts.format("MMM D");

    return ts;
}

function SecondaryInformation (classes, first_message) {
    const { 
        sms_msg: message, ts: msg_ts, 
        source, send_status, ts_sent
    } = first_message;
    const ts = returnTS(msg_ts);

    return (
        <Grid 
            container 
            justify="space-between"
            spacing={0}
        >
            <Grid item xs={1} style={{ flexBasis: 0, marginRight: 6 }}>
                {
                    source === "inbox" ? (
                        <CallReceived fontSize="small" />
                    ) : (
                        <CallMade fontSize="small" />
                    )
                }
            </Grid>
            <Grid item xs className={classes.overflowEllipsis}>
                {message}
            </Grid>
            <Grid
                item
                style={{ marginRight: 8 }}
                className={classes.noFlexGrow}
            >
                {ts}
            </Grid>
            <Grid item style={{ paddingTop: 2, marginRight: 8 }}>
                {
                    (send_status === 0 || (send_status === null && ts_sent !== null)) && <RadioButtonUnchecked className={classes.sentIcon} />
                }
                {
                    send_status > 0 && send_status <= 5 && (
                        <CheckCircle color="primary" className={classes.sentIcon} />
                    )
                }
                {
                    (send_status === -1 || send_status > 5) && <Cancel color="error" className={classes.sentIcon} />
                }
            </Grid>
        </Grid>
    );
}

// eslint-disable-next-line max-params
function MessageListItem (row, props, openOptionsModal, index) {
    const { messages, mobile_details } = row;
    const [first_message] = messages;
    const { is_per_convo, ts } = first_message;
    const { classes, url, width, async, is_desktop, searchFilters } = props;

    const { mobile_id, sim_num, users } = mobile_details;
    const sim_number = simNumFormatter(sim_num);
    let senders = [{ sender: sim_number, org: sim_number, inactive: false }];
    let orgs = [];

    const is_unknown = users.length === 0; // users === null;
    if (!is_unknown) {
        const { sender_arr, orgs_arr } = mobileUserFormatter(users);
        senders = sender_arr;
        orgs = orgs_arr;
    }

    let search_filters = null;
    if (typeof searchFilters !== "undefined") {
        search_filters = { ...searchFilters };
       
        if (is_per_convo) {
            search_filters.ts_end = ts;
        }
    }
    
    const no_convo_message = searchFilters ? "No conversations" : "No conversation yet";
    
    const on_option_button_click = e => {
        e.preventDefault();
        openOptionsModal(is_unknown, mobile_details);
    };

    const InactiveIcon = <MobileOff
        style={{ color: "red", marginRight: 6 }}
        fontSize="small" titleAccess="Inactive number"/>;

    return (
        <Link 
            to={{
                pathname: `${url}/${mobile_id}`,
                state: {
                    async, search_filters,
                    test: "data"
                }
            }} 
            key={`${index}-${mobile_id}`} 
            className={classes.link}
        >
            <ListItem alignItems="center" button>
                <ListItemAvatar>
                    <Avatar alt="User" src={GenericAvatar} className={classes.bigAvatar} />
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Grid container spacing={0} justify="flex-start" alignItems="center">
                            <Grid item xs className={classes.noFlexGrow}>
                                <Typography 
                                    variant="body1" 
                                    className={classes.overflowEllipsis}
                                    component="div"
                                    style={{ display: "flex", alignItems: "center" }}
                                >
                                    {senders.map((row, i) => {
                                        return (
                                            <Fragment key={`${row.sender}-${mobile_id}`}>
                                                {senders.length > 1 && row.inactive && InactiveIcon}
                                                <span title={row.org} 
                                                    style={{ paddingRight: 4 }}
                                                >
                                                    {row.sender}{i < senders.length - 1 && ","}
                                                </span>
                                            </Fragment>
                                        );
                                    })}
                                </Typography>
                            </Grid>
                            
                            {
                                orgs.map((x, i) => {
                                    const color = i === 0 ? "secondary" : "primary";
                                    return (
                                        <Grid key={i} item xs className={classes.noFlexGrow}>
                                            <Chip color={color} size="small" label={x} />
                                        </Grid>
                                    );
                                })
                            }

                            <Grid 
                                item xs={6} sm
                                container justify={isWidthUp("sm", width) ? "flex-end" : "flex-start"}
                                alignItems="center"
                            >
                                {
                                    (senders.length === 1 && senders[0].inactive) && InactiveIcon
                                }

                                <Typography 
                                    variant="subtitle2" 
                                    color="textSecondary"
                                >
                                    {sim_number}
                                </Typography>
                            </Grid>
                            <Grid 
                                item xs 
                                style={{ 
                                    textAlign: "right",
                                    flexGrow: is_desktop ? 0 : 1,
                                    flexBasis: "auto" 
                                }}
                            >
                                <IconButton size="small" onClick={on_option_button_click}>
                                    <MoreVert />
                                </IconButton>
                            </Grid>
                        </Grid>
                    }
                    primaryTypographyProps={{
                        className: classes.overflowEllipsis
                    }}
                    secondary={
                        messages.length > 0 ? (
                            SecondaryInformation(classes, first_message)
                        ) : (
                            <div style={{ textAlign: "center" }}>{no_convo_message}</div>
                        )
                    }
                    secondaryTypographyProps={{ component: "div" }}
                />
            </ListItem>
        </Link>
    );
}

function MessageList (comp_props) {
    const { messagesArr, hidden } = comp_props;
    const classes = useStyles();
    const props = { ...comp_props, classes };

    const [open_options, setOpenOptions] = React.useState(false);
    const [is_unregistered, setIfUnregistered] = React.useState(false);
    const [open_block_modal, setBlockModal] = React.useState(false);
    const [open_save_contact_modal, setSaveContactModal] = React.useState(false);
    const [chosen_mobile, setChosenMobile] = React.useState({});

    const openOptionsModal = (is_unreg, mobile_details) => {
        setIfUnregistered(is_unreg);
        setChosenMobile(mobile_details);
        setOpenOptions(true);
    };

    const handleOptionsClose = value => {
        setOpenOptions(false);
    };
    
    return (
        <Fragment>
            {
                messagesArr.length === 0 ? (
                    <Paper
                        style={{
                            height: "30vh", padding: 60, display: "flex",
                            justifyContent: "center", alignItems: "center",
                            background: "gainsboro", border: "4px solid #CCCCCC",
                            marginTop: 30
                        }}
                        className={ hidden ? classes.hidden : "" }
                    >
                        <div>No conversations</div>
                    </Paper>
                ) : (
                    <List dense className={ hidden ? classes.hidden : "" }>
                        {
                            messagesArr.map((row, index) => MessageListItem(row, props, openOptionsModal, index))
                        }
                    </List>
                )
            }

            <OptionsModal 
                open={open_options}
                onClose={handleOptionsClose}
                isUnregistered={is_unregistered}
                setBlockModal={setBlockModal}
                setSaveContactModal={setSaveContactModal}
            />

            <BlockNumberModal
                open={open_block_modal}
                setBlockModal={setBlockModal}
                mobileDetails={chosen_mobile}
                setOpenOptions={setOpenOptions}
            />

            <SaveContactModal
                open={open_save_contact_modal}
                setSaveContactModal={setSaveContactModal}
                mobileDetails={chosen_mobile}
                setOpenOptions={setOpenOptions}
            />
        </Fragment>
    );
}

export default MessageList;