import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { Avatar, Grid, Badge, IconButton, Paper, ListItemText, List,
    ListItem, ListItemIcon, CardActions, Button, Hidden, Dialog, AppBar,
    Toolbar, Slide
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import AddAPhotoIcon from "@material-ui/icons/AddAPhoto";
import PhoneIcon from "@material-ui/icons/Phone";
import EmailIcon from "@material-ui/icons/Email";
import CloseIcon from "@material-ui/icons/Close";
import WcIcon from "@material-ui/icons/Wc";
import MyShifts from "./UserShift";

const useStyles = makeStyles({
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
});

const Transition = React.forwardRef((props, ref) => {
    return <Slide direction="left" ref={ref} {...props} />;
});

function ProfilePage (props) {
    const { selectedUserDetails, isUser } = props;
    const { first_name, nickname, middle_name, 
        sex, last_name, user_id, mobile_numbers, 
        emails } = selectedUserDetails;
    const classes = useStyles();
    const [isShiftOpen, setShiftopen] = useState(false);
    const gender = sex === "M" || sex === "m" ? "Male" : "Female";

    const contact_nums = mobile_numbers.map(data => {
        return data.mobile_number.sim_num;
    });

    const handleClose = () => {
        setShiftopen(false);
    };

    const handleOpen = () => {
        setShiftopen(true);
    };

    const changeProfilePic = id => {
        console.log("user_id", id);
    };

    const BadgeButton = () => {
        return (
            <IconButton className={classes.addPhotoButton} onClick={e => changeProfilePic(user_id)}>
                <AddAPhotoIcon/>
            </IconButton>
        );
    };

    const cover_photo = "https://images.unsplash.com/photo-1526731955462-f6085f39e742?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1049&q=80";
    const profile_pic = "https://images.unsplash.com/photo-1592088998042-49cc3be54c03?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80";

    return (
        <Grid container>
            <Grid item xs={12}>
                <Card className={classes.wall}>
                    <CardMedia
                        className={classes.media}
                        image= {cover_photo}
                        title="Contemplative Reptile"
                    />
                    <CardContent className={classes.centerText}>
                        <Grid container className={classes.avatarContainer} justify="center">
                            <Badge
                                overlap="circle"
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                badgeContent={ isUser && <BadgeButton/>}
                            >
                                <Avatar 
                                    className={classes.avatar} 
                                    src={profile_pic}
                                />
                            </Badge>
                        </Grid>
                        <Typography gutterBottom variant="h5" component="h2">
                            {`${first_name} ${middle_name === "NA" ? "" : middle_name} ${last_name}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                            {nickname}
                        </Typography>
                    </CardContent>
                    { isUser &&
                        <CardActions>
                            <Hidden mdUp>
                                <Button size="small" color="primary" onClick={handleOpen}>
                                    View Monitoring Schedule
                                </Button>
                            </Hidden>
                        </CardActions>
                    }
                </Card>
                <Grid item xs={12}>
                    <Paper>
                        <Grid container>
                            <Grid item md={6} xs={12}>
                                <List component="nav" aria-label="details">
                                    { contact_nums.map( row => {
                                        return ( 
                                            <ListItem key={row}>
                                                <ListItemIcon>
                                                    <PhoneIcon/>
                                                </ListItemIcon>                 
                                                <ListItemText primary={row} />    
                                            </ListItem>
                                        );
                                    })}
                                    { emails.map( row => {
                                        return ( 
                                            <ListItem key={row.email_id}>
                                                <ListItemIcon>
                                                    <EmailIcon/>
                                                </ListItemIcon>                 
                                                <ListItemText primary={row.email} />    
                                            </ListItem>
                                        );
                                    })}                                
                                    <ListItem >
                                        <ListItemIcon>
                                            <WcIcon/>
                                        </ListItemIcon>
                                        <ListItemText primary={gender} />
                                    </ListItem>
                                </List>
                            </Grid>
                        </Grid>
                    </Paper>
                    {
                        isUser &&
                            <Hidden mdUp>
                                <Dialog fullScreen open={isShiftOpen} onClose={handleClose} TransitionComponent={Transition}>
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
                                            <Typography>My Monitoring Schedules</Typography>
                                        </Toolbar>
                                    </AppBar>
                                    <Grid container spacing={2} >
                                        <Grid item style={{ marginTop: 70 }} sm={12} xs={12}>
                                            <MyShifts />
                                        </Grid>
                                    </Grid>
                                </Dialog>
                            </Hidden>
                    }
                </Grid>
            </Grid>
        </Grid>
    );
}
export default ProfilePage;

