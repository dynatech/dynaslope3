import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
    List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Grid
} from "@material-ui/core";
import { Link } from "react-router-dom";
import moment from "moment";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import { sample_messages } from "../../../store";

const styles = theme => ({
    inline: {
        display: "inline",
    },
    overflowEllipsis: {
        fontSize: "inherit",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden"
    },
    link: { textDecoration: "none" }
});

function MessageListItem (row, props) {
    const { id, sender, message, ts_received } = row;
    const { classes, url, clickHandler } = props;
    const ts = returnTS(ts_received);

    return (
        <Link to={`${url}/${id}`} key={id} className={classes.link}>
            <ListItem alignItems="flex-start" button onClick={clickHandler}>
                <ListItemAvatar>
                    <Avatar alt={sender} src={GenericAvatar} className={classes.bigAvatar} />
                </ListItemAvatar>
                <ListItemText
                    primary={sender}
                    primaryTypographyProps={{
                        className: classes.overflowEllipsis
                    }}
                    secondary={
                        <Grid container justify="space-between">
                            <Grid item xs className={classes.overflowEllipsis}>
                                {message}
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                style={{ textAlign: "right" }}
                            >
                                {ts}
                            </Grid>
                        </Grid>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                />
            </ListItem>
        </Link>
    );
}

function returnTS (ts_received) {
    const moment_ts = moment(ts_received);
    const is_today = moment_ts.isSame(moment(), "day");
    const ts = is_today ? moment_ts.format("HH:mm") : moment_ts.format("MMM D");

    return ts;
}

function MessageList (props) {
    return (
        <List dense>
            {
                sample_messages.map(row => MessageListItem(row, props))
            }
        </List>
    );
}

MessageList.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MessageList);