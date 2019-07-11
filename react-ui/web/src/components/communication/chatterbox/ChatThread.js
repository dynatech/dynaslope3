import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import { IconButton } from "@material-ui/core";
import { TurnedIn, TurnedInNot } from "@material-ui/icons";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import GeneralDataTagModal from "../../widgets/GeneralDataTagModal";

const styles = theme => ({
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
        border: "solid 1px rgba(0, 0, 0, 0.12)",
        backgroundColor: "rgba(0, 0, 0, 0.04)"
    },
    chatBubbleReceived: {
        marginLeft: 14,
    },
    chatBubbleSent: {
        marginRight: 14
    },
    chatMessage: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        lineHeight: "1.25em"
    },
    timestampArea: { textAlign: "right" },
    timestamp: {
        fontSize: "0.65rem",
        paddingTop: 6
    },
    tagButton: {
        padding: 0
    }
});

function chatBubbleCreator (classes, message_row, set_function) {
    const {
        convo_id,
        user, sms_msg: message,
        ts_received, ts_written,
        tags
    } = message_row;

    const is_you = user === "You";
    let timestamp = is_you ? ts_written : ts_received;
    timestamp = moment(timestamp).format("M/D/YYYY HH:mm");

    const avatar_component = <ListItemAvatar>
        <Avatar alt="Remy Sharp" src={GenericAvatar} />
    </ListItemAvatar>;

    const tag_icon = tags.length > 0 
        ? <TurnedIn fontSize="small" color="primary" />
        : <TurnedInNot fontSize="small" color="primary" />;

    const bubble_area = <ListItemText
        className={`${classes.chatBubble} ${is_you ? classes.chatBubbleSent : classes.chatBubbleReceived}`}
        primary={
            <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                <span style={{ paddingRight: 6 }}>{message}</span>
                <IconButton className={classes.tagButton} onClick={set_function(true)}>
                    {tag_icon}
                </IconButton>
            </Typography>
        }
        secondary={
            <div className={classes.timestamp}>{timestamp}</div>
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
    const { classes, message_list } = props;
    const [is_gdt_modal_open, set_is_gdt_modal_open] = useState(false);

    const set_function = bool => () => set_is_gdt_modal_open(bool);

    return (
        <Fragment>
            <List className={classes.root}>
                {
                    message_list.map(row => chatBubbleCreator(classes, row, set_function))
                }
            </List>

            <GeneralDataTagModal
                isOpen={is_gdt_modal_open}
                clickHandler={set_function(false)}
                tagOption="messages"
            />
        </Fragment>
    );
}

ChatThread.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ChatThread);