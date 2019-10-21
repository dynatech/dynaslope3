import React from "react";

import {
    Button, Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, ListItemSecondaryAction, IconButton,
    Avatar, TextField, Hidden,
    ListItemIcon, Chip, Drawer,
    Paper, Divider, Slide,
    Backdrop
} from "@material-ui/core";
import { 
    Create, Search,
    Folder as FolderIcon, Delete as DeleteIcon,
    Close, Person
} from "@material-ui/icons";

import { getUserOrganizations } from "../../../UtilityFunctions";

function ContactList (props) {
    const {
        contacts, onContactClickFn, classes
    } = props;

    return (
        <List dense style={{ paddingTop: 0 }}>
            {
                contacts.map(row => {
                    const { user } = row;
                    const { user_id, first_name, last_name } = user;
                    const orgs = getUserOrganizations(user);

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
                                                const color = i === 0 ? "secondary" : "primary";
                                                return (
                                                    <Grid key={i} item xs className={classes.noFlexGrow}>
                                                        <Chip color={color} size="small" label={x} />
                                                    </Grid>
                                                );
                                            })
                                        }
                                    </Grid>
                                }
                                // secondary="Secondary text"
                            />
                            {/* <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="delete">
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction> */}
                        </ListItem>
                    );
                })
            }
        </List>
    );
}

export default React.memo(ContactList);