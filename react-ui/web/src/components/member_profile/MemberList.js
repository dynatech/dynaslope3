import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

import { Grid, ListItemText, List, ListItem, TextField
} from "@material-ui/core";


const useStyles = makeStyles(theme => ({
    root: {
        maxWidth: "100%",
        flexGrow: 1,
    },
    container: {
        maxWidth: "50%",
    },
    wall: {
        width: "100%",
    },
    media: {
        height: 200,
    },
    avatar: {
        width: 150,
        height: 150,
    // border: '10px solid #f3f3f3'
    },
    avatarContainer: {
        marginTop: -75,
        display: "flex",
    },
    badge: {
        backgroundColor: "#44b700",
        color: "#44b700",
        "&::after": {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            animation: "$ripple 1.2s infinite ease-in-out",
            border: "1px solid currentColor",
            content: "\"\"",
        },
    },
    addPhotoButton: {
        backgroundColor: "#f2f2f2",
    },
    box: {
        backgroundColor: "#0099ff",
        padding: 10,
        textAlign: "left",
    },
    centerText: {
        textAlign: "center",
    },
    list: {
        maxHeight: 600,
        width: "90%",
        overflowY: "auto", 
        padding: theme.spacing(3),
    },
    searchBox: {
        marginLeft: 10,
        width: "90%",
    }
}));


function MemberList (props) {
    const { users, onMemberClickFn } = props;
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
        <Grid container spacing={2}>
            <Grid item md={6} xs={12} />
            <Grid container spacing={3}>
                <Grid item md={6} xs={12}>
                    <TextField 
                        fullWidth 
                        label="Search dynaslope member" 
                        variant="outlined"
                        onChange={event => setSearchStr(event.target.value)} 
                        className={classes.searchBox}/>
                </Grid>
                <List aria-label="list" className={classes.list} >
                    {
                        usersList !== null && usersList.map( user => {
                            const name = `${user.first_name } ${user.last_name}`;
                            return (
                                <ListItem 
                                    button 
                                    key={user.user_id} 
                                    onClick={onMemberClickFn(user)}
                                >
                                    <ListItemText primary={name} />
                                </ListItem>
                            );
                        })
                    }
                </List>
            </Grid>

        </Grid>

   
    );
}
export default MemberList;

