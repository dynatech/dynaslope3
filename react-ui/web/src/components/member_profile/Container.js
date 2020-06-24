import React, { useState, Fragment, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Hidden, IconButton } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import { getCurrentUser } from "../sessions/auth";
import MemberList from "./MemberList";
import ProfilePage from "./ProfileDetails";
import MyShifts from "./UserShift";
import { getDynaslopeUsers } from "./ajax";

const useStyles = makeStyles(theme=>({
    root: {
        maxWidth: "100%",
        flexGrow: 1,
        padding: "10px",
    },
    schedIcon: {
        width: 50,
        height: 50,
        display: "flex",
    },
    margin: {
        margin: theme.spacing(1),
    },
    appBar: {
        position: "relative",
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
}));

const Transition = React.forwardRef((props, ref) => {
    return <Slide direction="up" ref={ref} {...props} />;
});
  
export default function ProfileContainer (props) {
    const classes = useStyles();
    const currentUser = getCurrentUser();
    const [users, setUsers] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [open, setOpen] = useState(true);
    const [isUser, setIsUser] = useState(false);

    useEffect(() => {
        getDynaslopeUsers(data => setUsers(data));
    }, []);

    useEffect(() => {
        if (users !== null) {
            const current = users.filter(data => {
                if ( data.user_id === currentUser.user_id ) {
                    return data; 
                }
                return null;
            }); 
            setSelectedUser(current[0]);
        }
    }, [users]);

    useEffect(() => {
        if (selectedUser !== null) {
            selectedUser.user_id === currentUser.user_id ? setIsUser(true) : setIsUser(false);
        }
    }, [selectedUser]);

    const onMemberClickFn = user => () => {
        setSelectedUser(user);
        setOpen(true);
    };
    
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div className={classes.root}>
            <Grid container justify="center">
                { users !== null &&
                    <Grid item md={6} xs={12} sm={12}>
                        <MemberList
                            users={users}
                            onMemberClickFn={onMemberClickFn}
                        />
                    </Grid>
                }
                {
                    selectedUser !== null && (
                        <Fragment>
                            <Hidden smDown>
                                <Grid item md={6} xs={12} sm={12}>
                                    <ProfilePage
                                        currentUser={currentUser}
                                        selectedUserDetails={selectedUser}
                                        isUser={isUser}
                                    />
                                    <Hidden smDown>
                                        { isUser && 
                                            <MyShifts/>
                                        }
                                    </Hidden>
                                </Grid>   
                            </Hidden>

                            <Hidden mdUp>
                                <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
                                    <AppBar className={classes.appBar}>
                                        <Toolbar>
                                            <IconButton 
                                                edge="end" 
                                                color="inherit" 
                                                onClick={handleClose} 
                                                aria-label="close"
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </Toolbar>
                                    </AppBar>
                                    <ProfilePage
                                        currentUser={currentUser}
                                        selectedUserDetails={selectedUser}
                                        isUser={isUser}
                                    />
                                </Dialog>
                            </Hidden>
                        </Fragment>
                    )
                }
            </Grid> 
        </div>
    );
}

