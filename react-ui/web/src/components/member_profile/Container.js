import React, { useState, Fragment, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Hidden, IconButton, Button, CardActions } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import LockIcon from "@material-ui/icons/Lock";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../sessions/auth";
import MemberList from "./MemberList";
import ProfilePage from "./ProfileDetails";
import MyShifts from "./UserShift";
import { GeneralContext } from "../contexts/GeneralContext";

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
    const { users } = useContext(GeneralContext);
    const currentUser = getCurrentUser();
    const [users_list, setUsers] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [open, setOpen] = useState(true);
    const [isUser, setIsUser] = useState(false);
    const [isWebAdmin, setWebAdmin] = useState(false);

    useEffect(() => {
        setUsers(users);
    }, [users]);

    useEffect(() => {
       
        if (typeof users_list !== "undefined" && users_list !== null) {
            const current = users_list.filter(data => {
                if ( data.user_id === currentUser.user_id ) {
                    return data; 
                }
            }); 
            setSelectedUser(current[0]);
        }
    }, [users_list]);

    useEffect(() => {
        if (typeof selectedUser !== "undefined" && selectedUser !== null) {
            selectedUser.user_id === currentUser.user_id ? setIsUser(true) : setIsUser(false);
            selectedUser.teams.forEach(row => {
                row.team_id === 31 ? setWebAdmin(true) : setWebAdmin(false);
            });
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
                { users_list !== null &&
                    <Grid item md={6} xs={12} sm={12}>
                        <MemberList
                            users={users_list}
                            onMemberClickFn={onMemberClickFn}
                            isWebAdmin={isWebAdmin}
                            isUser={isUser}
                        />
                       
                    </Grid>
                }
                {
                    selectedUser !== null && (
                        <Fragment>
                            <Hidden smDown>
                                <Grid item md={6} xs={12} sm={12}>
                                    {typeof selectedUser !== "undefined" && (
                                        <ProfilePage
                                            currentUser={currentUser}
                                            selectedUserDetails={selectedUser}
                                            isUser={isUser}
                                            isAdmin={isWebAdmin}
                                        />
                                    )}
                                    <Hidden smDown>
                                        { isUser && 
                                        (
                                            <div>
                                                <CardActions>
                                                    <Link to= "/profile/update" style={{ textDecoration: "none" }}>
                                                        <Button size="small" startIcon={<LockIcon/>} color="primary">
                                                            Change password
                                                        </Button>
                                                    </Link>
                                                </CardActions>
                                                {/* <MyShifts/> */}
                                            </div>
                                        )}
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
                                    {typeof selectedUser !== "undefined" && (
                                        <ProfilePage
                                            currentUser={currentUser}
                                            selectedUserDetails={selectedUser}
                                            isUser={isUser}
                                            isAdmin={isWebAdmin}
                                        />
                                    )}
                                </Dialog>
                            </Hidden>
                        </Fragment>
                    )
                }
            </Grid> 
        </div>
    );
}

