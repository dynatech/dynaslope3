import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import GenericAvatar from "../../../images/generic-user-icon.jpg";

const styles = theme => ({
    root: {
        width: "100%",
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        display: "inline",
    },
    // chatItem: {
    //     paddingBottom: 14
    // },
    chatBubbleReceived: {
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 12,
        paddingBottom: 12,
        marginLeft: 14,
        border: "solid 1px"
    },
    chatBubbleSent: {
        paddingLeft: "12px !important",
        paddingRight: 12,
        paddingTop: 12,
        paddingBottom: 12,
        marginRight: 14,
        border: "solid 1px"
    },
    chatMessage: {
        fontSize: "0.75rem",
        lineHeight: "1.25em"
    }
});

function AlignItemsList (props) {
    const { classes } = props;
    return (
        <List className={classes.root}>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
                <ListItemText className={classes.chatBubbleReceived}
                    primary={
                        <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
                        </Typography>
                    }
                />
            </ListItem>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemText className={classes.chatBubbleSent}
                    primary={
                        <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                            Loerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
                        </Typography>
                    }
                />
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
            </ListItem>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemText className={classes.chatBubbleSent}
                    primary={
                        <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                            Cupiditate numquam dignissimos laborum fugiat deleniti?
                        </Typography>
                    }
                />
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
            </ListItem>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
                <ListItemText className={classes.chatBubbleReceived}
                    primary={
                        <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                            Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
                        </Typography>
                    }
                />
            </ListItem>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemText className={classes.chatBubbleSent}
                    primary={
                        <Typography component="span" className={classes.chatMessage} variant="body2" color="textPrimary">
                            Quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam
                        </Typography>
                    }
                />
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
            </ListItem>

            {/* <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
                <ListItemText
                    primary="Summer BBQ"
                    secondary={
                        <React.Fragment>
                            <Typography component="span" className={classes.chatMessage} className={classes.inline} color="textPrimary">
                to Scott, Alex, Jennifer
                            </Typography>
                            {" — Wish I could come, but I'm out of town this…"}
                        </React.Fragment>
                    }
                />
            </ListItem>
            <ListItem alignItems="flex-start" className={classes.chatItem}>
                <ListItemAvatar>
                    <Avatar alt="Remy Sharp" src={GenericAvatar} />
                </ListItemAvatar>
                <ListItemText
                    primary="Oui Oui"
                    secondary={
                        <React.Fragment>
                            <Typography component="span" className={classes.chatMessage} className={classes.inline} color="textPrimary">
                Sandra Adams
                            </Typography>
                            {" — Do you have Paris recommendations? Have you ever…"}
                        </React.Fragment>
                    }
                />
            </ListItem> */}
        </List>
    );
}

AlignItemsList.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(AlignItemsList);