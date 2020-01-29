import React, { useState, Fragment } from "react";
import moment from "moment";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { IconButton, Tooltip, makeStyles } from "@material-ui/core";
import {
    TurnedIn, TurnedInNot,
    RadioButtonUnchecked, CheckCircle, Cancel
} from "@material-ui/icons";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import GeneralDataTagModal from "../../widgets/GeneralDataTagModal";
import { loadMoreMessages } from "../ajax";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        display: "inline",
    },
    chatItemSent: {
        justifyContent: "flex-end"
    },
    chatBubble: {
        flexGrow: 0,
        maxWidth: "65%",
        [theme.breakpoints.down("xs")]: {
            maxWidth: "75%"
        },
        [theme.breakpoints.up("md")]: {
            maxWidth: "50%"
        }, 
        paddingLeft: "12px !important",
        paddingRight: 12,
        paddingTop: 12,
        paddingBottom: 6,
        border: "solid 1px rgba(215, 215, 215, 1)",
        backgroundColor: "rgba(245, 245, 245, 1)"
    },
    chatBubbleReceived: {
        marginLeft: 14,
        "&:before": {
            content: "''",
            left: 69,
            right: "auto",
            top: 14,
            border: "18px solid",

            position: "absolute",
            width: 0,
            height: 0,
            bottom: "auto",
            borderColor: "rgba(215, 215, 215, 1) transparent transparent transparent",
        },
        "&:after": {
            content: "''",
            left: 71.5,
            right: "auto",
            top: 15,
            border: "20px solid",

            position: "absolute",
            width: 0,
            height: 0,
            bottom: "auto",
            borderColor: "rgba(245, 245, 245, 1) transparent transparent transparent",
        }
    },
    chatBubbleSent: {
        marginRight: 14,
        "&:before": {
            content: "''",
            left: "auto",
            right: 69,
            top: 14,
            border: "18px solid",

            position: "absolute",
            width: 0,
            height: 0,
            bottom: "auto",
            borderColor: "rgba(215, 215, 215, 1) transparent transparent transparent",
        },
        "&:after": {
            content: "''",
            left: "auto",
            right: 71.5,
            top: 15,
            border: "20px solid",

            position: "absolute",
            width: 0,
            height: 0,
            bottom: "auto",
            borderColor: "rgba(245, 245, 245, 1) transparent transparent transparent",
        }
    },
    chatMessage: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        lineHeight: "1.25em"
    },
    timestampArea: { 
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 12
    },
    timestamp: {
        fontSize: "0.65rem",
    },
    tagButton: {
        padding: 0,
        zIndex: 1
    },
    sentIcon: {
        fontSize: "1rem"
    }
}));

function arrowGenerator (color) {
    return {
        "&[x-placement*=\"bottom\"] $arrow": {
            top: 0,
            left: 0,
            marginTop: "-0.95em",
            width: "2em",
            height: "1em",
            "&::before": {
                borderWidth: "0 1em 1em 1em",
                borderColor: `transparent transparent ${color} transparent`,
            },
        },
        "&[x-placement*=\"top\"] $arrow": {
            bottom: 0,
            left: 0,
            marginBottom: "-0.95em",
            width: "2em",
            height: "1em",
            "&::before": {
                borderWidth: "1em 1em 0 1em",
                borderColor: `${color} transparent transparent transparent`,
            },
        },
        "&[x-placement*=\"right\"] $arrow": {
            left: 0,
            marginLeft: "-0.95em",
            height: "2em",
            width: "1em",
            "&::before": {
                borderWidth: "1em 1em 1em 0",
                borderColor: `transparent ${color} transparent transparent`,
            },
        },
        "&[x-placement*=\"left\"] $arrow": {
            right: 0,
            marginRight: "-0.95em",
            height: "2em",
            width: "1em",
            "&::before": {
                borderWidth: "1em 0 1em 1em",
                borderColor: `transparent transparent transparent ${color}`,
            },
        },
    };
}

const useStylesBootstrap = makeStyles(theme => ({
    arrow: {
        position: "absolute",
        fontSize: 6,
        "&::before": {
            content: "\"\"",
            margin: "auto",
            display: "block",
            width: 0,
            height: 0,
            borderStyle: "solid",
        },
    },
    popper: arrowGenerator(theme.palette.common.black),
    tooltip: {
        position: "relative",
        backgroundColor: theme.palette.common.black,
    },
    tooltipPlacementLeft: {
        margin: "0 8px",
    },
    tooltipPlacementRight: {
        margin: "0 8px",
    },
    tooltipPlacementTop: {
        margin: "8px 0",
    },
    tooltipPlacementBottom: {
        margin: "8px 0",
    },
}));
  
function BootstrapTooltip (props) {
    const { arrow, ...classes } = useStylesBootstrap();
    const [arrowRef, setArrowRef] = React.useState(null);
    const { title } = props;

    return (
        <Tooltip
            classes={classes}
            PopperProps={{
                popperOptions: {
                    modifiers: {
                        arrow: {
                            enabled: Boolean(arrowRef),
                            element: arrowRef,
                        },
                    },
                },
            }}
            {...props}
            title={
                <React.Fragment>
                    {title}
                    <span className={arrow} ref={setArrowRef} />
                </React.Fragment>
            }
        />
    );
}

function chatBubbleCreator (classes, message_row, set_gdt_fn) {
    const {
        convo_id,
        source, sms_msg: message,
        ts, ts_sent, send_status,
        tags
    } = message_row;

    const tag_object = {
        tags,
        source,
        id: message_row[`${source}_id`],
    };

    const is_you = source === "outbox";
    const timestamp = moment(ts).format("M/D/YYYY HH:mm:ss");

    const avatar_component = <ListItemAvatar style={{ textAlign: "-webkit-center" }}>
        <Avatar alt="Remy Sharp" src={GenericAvatar} />
    </ListItemAvatar>;

    const tag_icon = tags.length > 0 
        ? <TurnedIn fontSize="small" color="primary" />
        : <TurnedInNot fontSize="small" color="primary" />;

    const bubble_area = <ListItemText
        className={`${classes.chatBubble} ${is_you ? classes.chatBubbleSent : classes.chatBubbleReceived}`}
        primary={
            <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                <span style={{ paddingRight: 6, zIndex: 1 }}>{message}</span>
                <IconButton className={classes.tagButton} onClick={set_gdt_fn(true, tag_object, message)}>
                    {tag_icon}
                </IconButton>
            </Typography>
        }
        secondary={
            <Fragment>
                <div 
                    className={classes.timestamp}
                    style={{ paddingRight: is_you ? 6 : 0 }}
                >
                    {timestamp}
                </div>
                {
                    (send_status >= 0 && send_status < 5 && send_status !== null) && <RadioButtonUnchecked className={classes.sentIcon} />
                }
                {
                    send_status === 5 && (
                        <BootstrapTooltip disableFocusListener title={ moment(ts_sent).format("M/D/YYYY HH:mm:ss") }>
                            <CheckCircle color="primary" className={classes.sentIcon} />
                        </BootstrapTooltip>
                    )
                }
                {
                    (send_status === -1 || send_status > 5) && <Cancel color="error" className={classes.sentIcon} />
                }
            </Fragment>
        }
        secondaryTypographyProps={{ component: "div", className: classes.timestampArea }}
    />;

    let arr = [avatar_component, bubble_area];
    if (is_you) arr = arr.reverse();
    const [first, second] = arr;

    return <ListItem
        alignItems="flex-start"
        className={is_you ? classes.chatItemSent : ""}
        key={convo_id}
    >
        {first}{second}
    </ListItem>;
}

function ChatThread (props) {
    const { message_list, mobileDetails } = props;
    const classes = useStyles();

    const initial_messages = message_list.slice(0).reverse();

    const [messages, setMessages] = useState(initial_messages);
    const [is_gdt_modal_open, set_is_gdt_modal_open] = useState(false);
    const [selected_message, setSelectedMessage] = useState("");
    const default_tag_obj = {
        id: "", source: "", tags: []
    };

    const [tag_object, update_tag_object] = useState(default_tag_obj);
    const [message_batch, setMessageBatch] = useState(1);
    const [loaded_messages, setLoadedMessages] = useState(initial_messages);

    const set_gdt_fn = (bool, obj = default_tag_obj, message) => () => {
        update_tag_object(obj);
        set_is_gdt_modal_open(bool);
        setSelectedMessage(message);
        // create API to save tag
    };

    const onLoadMessageClick = () => {
        const { mobile_id } = mobileDetails;
        loadMoreMessages(mobile_id, message_batch, data => {
            setLoadedMessages(data);
            const reversed = data.slice(0).reverse();
            setMessages(reversed.concat(messages));
        });
        setMessageBatch(message_batch + 1);
    };

    return (
        <Fragment>
            {
                message_list.length === 0 && (
                    <Typography variant="subtitle1" align="center">
                        No conversation yet
                    </Typography>
                )
            }

            {
                loaded_messages.length >= 20 && (
                    <Button
                        color="primary"
                        size="small"
                        fullWidth
                        onClick={onLoadMessageClick}
                    >
                        <strong>Load more messages...</strong>
                    </Button>
                )
            }
                
            <List className={classes.root}>
                {
                    messages.map(row => chatBubbleCreator(classes, row, set_gdt_fn))
                }
            </List>

            <GeneralDataTagModal
                isOpen={is_gdt_modal_open}
                closeHandler={set_gdt_fn(false)}
                tagOption={tag_object.source} // UPDATE THIS FOR GOD SAKE
                tagObject={tag_object}
                mobileDetails={mobileDetails}
                message={selected_message}
            />
        </Fragment>
    );
}

export default ChatThread;