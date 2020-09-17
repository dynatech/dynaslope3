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
    Cancel, RadioButtonUnchecked, CheckCircle
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

export function mobileUserFormatter (user_details) {
    const { user } = user_details;
    const { first_name, last_name, organizations } = user;

    const sender = `${first_name} ${last_name}`;
    const orgs = getUserOrganizations(organizations);

    return { sender, orgs };
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

function MessageListItem (row, props, openOptionsModal) {
    const { messages, mobile_details } = row;
    const [first_message] = messages;
    const { classes, url, width, async, is_desktop, searchFilters } = props;

    const { mobile_id, sim_num, user_details } = mobile_details;
    const sim_number = simNumFormatter(sim_num);
    let sender = sim_number;
    let orgs = [];

    const is_unknown = user_details === null;
    if (!is_unknown) {
        const { sender: s, orgs: o } = mobileUserFormatter(user_details);
        sender = s;
        orgs = o;
    }

    let search_filters = null;
    if (typeof searchFilters !== "undefined") {
        search_filters = { ...searchFilters };
    }

    const no_convo_message = searchFilters ? "No conversations" : "No conversation yet";
    
    const on_option_button_click = e => {
        e.preventDefault();
        openOptionsModal(is_unknown, mobile_details);
    };

    return (
        <Link 
            to={{
                pathname: `${url}/${mobile_id}`,
                state: {
                    async, search_filters
                }
            }} 
            key={mobile_id} 
            className={classes.link}
        >
            <ListItem alignItems="center" button>
                <ListItemAvatar>
                    <Avatar alt={sender} src={GenericAvatar} className={classes.bigAvatar} />
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Grid container spacing={0} justify="flex-start" alignItems="center">
                            <Grid item xs className={classes.noFlexGrow}>
                                <Typography 
                                    variant="body1" 
                                    style={{ marginRight: 8 }}
                                    className={classes.overflowEllipsis}
                                >
                                    {sender}
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
                                style={{ textAlign: isWidthUp("sm", width) ? "right" : "left" }}
                            >
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
                            messagesArr.map(row => MessageListItem(row, props, openOptionsModal))
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