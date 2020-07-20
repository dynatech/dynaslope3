import React, { useState, useEffect, Fragment } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, ListItemText, List, ListItem, OutlinedInput
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    list: {
        maxHeight: "60vh",
        overflowY: "auto",
        boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
        "&::-webkit-scrollbar": {
            width: 5
        },
        "&::-webkit-scrollbar-track": {
            boxShadow: "inset 0 0 5px grey"
        },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(127, 127, 127, 0.7)"
        }
    },
    searchBox: {
        marginBottom: theme.spacing(3)
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
}));

function MemberList (props) {
    const { users, onMemberClickFn, selectedUserDetails } = props;
    const classes = useStyles();
    const [usersList, setUsersList] = useState(null);
    const [search_str, setSearchStr] = useState(null);

    useEffect(() => {
        setUsersList(users);
    }, [users]);

    useEffect(() => {
        if (search_str !== null ) {
            const filtered = users.filter(row => {
                const { first_name, last_name } = row;
                const name = `${first_name} ${last_name}`;
                const pattern = new RegExp(`${search_str.toLowerCase()}`, "gi");
                return pattern.test(name.toLocaleLowerCase());
            });
            setUsersList(filtered);
        } else {
            setUsersList(users);
        }
    }, [search_str]);

    return (
        <div className={classes.sticky}>
            <OutlinedInput
                fullWidth
                margin="dense"
                placeholder="Search Dynaslope staff..."
                onChange={event => setSearchStr(event.target.value)} 
                className={classes.searchBox}
            />

            <List aria-label="list" className={classes.list}>
                {
                    usersList !== null && usersList.map(user => {
                        const name = `${user.last_name}, ${user.first_name}`;
                        const is_selected = selectedUserDetails !== null && selectedUserDetails.user_id === user.user_id;

                        return (
                            <ListItem 
                                button 
                                key={user.user_id} 
                                onClick={onMemberClickFn(user)}
                                selected={is_selected}
                            >
                                <ListItemText primary={name} />
                            </ListItem>
                        );
                    })
                }
            </List>
        </div>
    );
}
export default MemberList;

