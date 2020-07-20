import React, { 
    useState, Fragment, useEffect,
    useContext
} from "react";

import {
    Grid, Hidden, IconButton,
    Dialog, AppBar, Toolbar,
    Slide, Card, makeStyles
} from "@material-ui/core";
import { Close } from "@material-ui/icons";

import PageTitle from "../reusables/PageTitle";
import MemberList from "./MemberList";
import ProfileDetails from "./ProfileDetails";

import GeneralStyles from "../../GeneralStyles";
import { GeneralContext } from "../contexts/GeneralContext";
import { getCurrentUser } from "../sessions/auth";

const useStyles = makeStyles(theme=>({
    ...GeneralStyles(theme),
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
  
function ProfileContainer (props) {
    const { match: { url } } = props;
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
                if (data.user_id === currentUser.user_id) {
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
                setWebAdmin(row.team.team_name === "web-admin");
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
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Dynaslope | Staff Profiles"
                />
            </div>

            <div className={classes.pageContentMargin}>
                <Grid container justify="center" spacing={2}>
                    { 
                        users_list !== null &&
                            <Grid item xs={12} md={4}>
                                <MemberList
                                    users={users_list}
                                    onMemberClickFn={onMemberClickFn}
                                    isWebAdmin={isWebAdmin}
                                    isUser={isUser}
                                    selectedUserDetails={selectedUser}
                                />
                            </Grid>
                    }
                    {
                        // selectedUser !== null && (
                        //     <Grid item md={9}>
                        //         Loading...
                        //     </Grid>
                        // )
                    }
                    {
                        selectedUser !== null && (
                            <Fragment>
                                <Hidden smDown>
                                    <Grid item xs={12} md={8}>
                                        {
                                            typeof selectedUser !== "undefined" && (
                                                <Card>
                                                    <ProfileDetails
                                                        currentUser={currentUser}
                                                        selectedUserDetails={selectedUser}
                                                        isUser={isUser}
                                                        isAdmin={isWebAdmin}
                                                        url={url}
                                                    />
                                                </Card>
                                            )
                                        }
                                    </Grid>   
                                </Hidden>

                                <Hidden mdUp>
                                    <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
                                        <AppBar className={classes.appBar}>
                                            <Toolbar style={{ justifyContent: "flex-end" }}>
                                                <IconButton 
                                                    edge="end" 
                                                    color="inherit" 
                                                    onClick={handleClose} 
                                                    aria-label="close"
                                                >
                                                    <Close />
                                                </IconButton>
                                            </Toolbar>
                                        </AppBar>

                                        {
                                            typeof selectedUser !== "undefined" && (
                                                <ProfileDetails
                                                    currentUser={currentUser}
                                                    selectedUserDetails={selectedUser}
                                                    isUser={isUser}
                                                    isAdmin={isWebAdmin}
                                                    url={url}
                                                />
                                            )
                                        }
                                    </Dialog>
                                </Hidden>
                            </Fragment>
                        )
                    }
                </Grid> 
            </div>
        </Fragment>
    );
}

export default ProfileContainer;
