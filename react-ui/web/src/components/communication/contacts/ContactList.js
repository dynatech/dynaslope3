import React from "react";

import {
    Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Chip,
    Tooltip
} from "@material-ui/core";
import { Person, Star } from "@material-ui/icons";

import { getUserOrganizations, getUserContactPriority } from "../../../UtilityFunctions";

const MemoizedItem = React.memo(props => {
    const { classes, row, onContactClickFn } = props;

    const { user_id, first_name, last_name, organizations } = row;
    const orgs = getUserOrganizations(organizations);
    const is_priority = getUserContactPriority(organizations);

    return (
        <ListItem 
            button
            onClick={onContactClickFn(row)}
            key={user_id}
        >
            <ListItemAvatar>
                <Avatar>
                    <Person />
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Grid 
                        container
                        spacing={0}
                        justify="flex-start"
                        alignItems="center"
                    >
                        <Grid 
                            item xl
                            style={{ flexGrow: 1 }}
                        >
                            <Typography 
                                variant="body1" 
                                style={{ marginRight: 8 }}
                            >
                                {`${last_name}, ${first_name}`}
                            </Typography>
                        </Grid>
                        {
                            orgs.map((x, i) => {
                                const bool = i === 0;
                                const color = bool ? "secondary" : "primary";

                                if (bool && is_priority) {
                                    return (
                                        <Grid key={i} item xs className={classes.noFlexGrow}>
                                            <Tooltip 
                                                arrow
                                                disableFocusListener
                                                title="Contact Priority"
                                                placement="top"
                                            >
                                                <Chip
                                                    color={color} size="small"
                                                    label={x}
                                                    icon={<Star style={{ color: "gold" }}/>}
                                                />
                                            </Tooltip>
                                        </Grid>
                                    );
                                }

                                return (
                                    <Grid key={i} item xs className={classes.noFlexGrow}>
                                        <Chip color={color} size="small" label={x} />
                                    </Grid>
                                );
                            })
                        }
                    </Grid>
                }
            />
        </ListItem>           
    );
});

function ContactList (props) {
    const {
        contacts, onContactClickFn, classes
    } = props;

    return (
        <List dense style={{ paddingTop: 0 }}>
            {
                contacts.map((row, index) => {
                    return <MemoizedItem 
                        row={row}
                        onContactClickFn={onContactClickFn}
                        classes={classes}
                        key={`list-${index}`}
                    />;
                })
            }
        </List>
    );
}

export default ContactList;