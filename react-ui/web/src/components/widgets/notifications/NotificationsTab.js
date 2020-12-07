import React, { Fragment, useContext, useState } from "react";

import {
    makeStyles, Divider, Typography, 
    Card, CardContent, IconButton, Box,
    Button
} from "@material-ui/core";
import { CallMade, FiberManualRecord, FiberManualRecordTwoTone } from "@material-ui/icons";

import moment from "moment";

import { NotificationsContext } from "../../contexts/NotificationsContext";
import { getCurrentUser } from "../../sessions/auth";

const useStyles = makeStyles(theme => ({
    divider: {
        margin: "16px 0"
    },
    sectionHead: {
        marginBottom: 12
    },
    cardSection: { marginBottom: 12 },
    card: { marginBottom: 8 },
    cardUnread: { backgroundColor: "lightgray" },
    cardContent: {
        paddingBottom: "16px !important",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    toggleReadIcon: {
        // paddingRight: 0
        marginLeft: 8
    },
    notifTS: { marginTop: 8 },
    noNotifs: {
        display: "flex",
        padding: 48,
        justifyContent: "center",
        border: "1px solid lightgray"
    }
}));

const NotificationCard = React.memo((props) => {
    const { classes, details, toggleNotifStatus, goToLink } = props;
    const { notification_id, message, ts_read, ts, link } = details;

    const toggle_to = ts_read ? "unread" : "read";
    
    return (
        <Card variant="outlined" className={`${classes.card} ${ts_read ? "" : classes.cardUnread}`}>
            <CardContent className={classes.cardContent} component={Box}>
                <Box>
                    <Typography variant="body2" component="div">
                        { message }
                    </Typography>

                    <Typography variant="caption" component="div" className={classes.notifTS}>
                        { moment(ts).format("D MMMM YYYY, HH:mm") }
                    </Typography>
                </Box>

                <Box align="right" className={classes.toggleReadIcon}>
                    {
                        link && <IconButton 
                            aria-label="go-to-link" 
                            color="primary" disableRipple disableFocusRipple edge="end"
                            size="small"
                            onClick={goToLink(link, notification_id, !ts_read)}
                            title="Go to link"
                        >
                            <CallMade />
                        </IconButton>
                    }

                    <IconButton 
                        aria-label="toggle-notif-status" 
                        color="primary" disableRipple disableFocusRipple edge="end"
                        size="small"
                        onClick={toggleNotifStatus(notification_id, toggle_to)}
                        title={`Mark as ${toggle_to}`}
                    >
                        { ts_read ? <FiberManualRecordTwoTone /> : <FiberManualRecord /> }
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
});

function NotificationsTab (props) {
    const { history, handleCloseNotif } = props;
    const classes = useStyles();

    const { user_id } = getCurrentUser();

    const { notifications_object, toggleReadTS } = useContext(NotificationsContext);
    const { notifications } = notifications_object;

    const [read_batch, setReadBatch] = useState(1); 

    const unread_notifs = [];
    const read_notifs = [];
    notifications.forEach(row => {
        if (row.ts_read === null) unread_notifs.push(row);
        else read_notifs.push(row);
    });

    const batch_read_notifs = read_notifs.slice(0, 10 * read_batch);
    const has_unloaded_read_notifs = read_notifs.length > read_batch * 10;

    const has_unread_notifs = unread_notifs.length !== 0;

    const markAllAsRead = () => {
        unread_notifs.forEach(row => {
            const { notification_id } = row;
            toggleReadTS(user_id, notification_id, "read");
        });
    };

    const toggleNotifStatus = React.useCallback((notification_id, toggle_to) => () => {
        toggleReadTS(user_id, notification_id, toggle_to);
    }, []);

    const goToLink = (link, notification_id, is_unread) => () => {
        handleCloseNotif();
        history.push(link);
        if (is_unread) { toggleReadTS(user_id, notification_id, "read"); }
    };

    return (
        <Fragment>
            <Typography variant="h4">
                Notifications
            </Typography>

            <Divider className={classes.divider} />

            <Box display="flex" justifyContent="space-between" alignItems="baseline">
                <Typography variant="h6" className={classes.sectionHead}>
                    Unread notifications
                </Typography>

                { has_unread_notifs && <Button color="primary" onClick={markAllAsRead}>Mark all as read</Button> }
            </Box>

            <div className={classes.cardSection}>
                {
                    !has_unread_notifs ? <Typography variant="body1" component="div" className={classes.noNotifs}>
                        No unread notifications
                    </Typography> : (
                        unread_notifs.map(row => <NotificationCard 
                            classes={classes} details={row} 
                            key={row.notification_id}
                            toggleNotifStatus={toggleNotifStatus}
                            goToLink={goToLink}
                        />)
                    )
                }
            </div>

            <Typography variant="h6" className={classes.sectionHead} style={{ marginTop: 24 }}>
                Previous notifications
            </Typography>

            <div className={classes.cardSection}>
                {
                    batch_read_notifs.length === 0 ? <Typography variant="body1" component="div" className={classes.noNotifs}>
                        No previous notifications
                    </Typography> : (
                        batch_read_notifs.map(row => <NotificationCard 
                            classes={classes} details={row} 
                            key={`notification-${ row.notification_id}`}
                            toggleNotifStatus={toggleNotifStatus}
                            goToLink={goToLink}
                        />)
                    )
                }
            </div>

            <Box display="flex" justifyContent="space-between" alignItems="baseline">
                { has_unloaded_read_notifs && <Button color="primary" onClick={() => setReadBatch(read_batch + 1)}>Load more previous notifications...</Button> }
            </Box>
        </Fragment>
    );
}

export default NotificationsTab;