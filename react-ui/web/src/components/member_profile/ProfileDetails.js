import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { Avatar, Grid, Badge, IconButton, Paper, ListItemText, List,
    ListItem, ListItemIcon, CardActions, Button, Hidden, Dialog, AppBar,
    Toolbar, Slide, TextField, Select, MenuItem, Divider, Checkbox
} from "@material-ui/core";
import StringMask from "string-mask";
import MaskedInput from "react-text-mask";
import Typography from "@material-ui/core/Typography";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import LockIcon from "@material-ui/icons/Lock";
import PhoneIcon from "@material-ui/icons/Phone";
import EventIcon from "@material-ui/icons/Event";
import EmailIcon from "@material-ui/icons/Email";
import CloseIcon from "@material-ui/icons/Close";
import WcIcon from "@material-ui/icons/Wc";
import { Link } from "react-router-dom";
import EditIcon from "@material-ui/icons/Edit";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
// import MyShifts from "./UserShift";
import { updateUserInfo } from "./ajax";
import Dyna_Wall from "../../images/dyna_wall.jpg";

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
        paddingTop: 20,
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

function TextMaskCustom (props) {
    const { inputRef, mask, ...other } = props;
  
    return (
        <MaskedInput
            {...other}
            ref={ref => {
                inputRef(ref ? ref.inputElement : null);
            }}
            mask={mask} placeholderChar="&times;"
            showMask
        />
    );
}

function ProfilePage (props) {
    const { selectedUserDetails, isUser } = props;
    const { first_name, nickname, middle_name, 
        sex, last_name, mobile_numbers, user_id, ewi_recipient, status,
        emails } = selectedUserDetails;
    const classes = useStyles();
    const [isShiftOpen, setShiftopen] = useState(false);
    const [isEdit, setEdit] = useState(false);
    const [enteredEmail, setEnteredEmail] = useState("");
    const [processedEmails, setEmails] = useState([]);
    const [enteredMobile, setEnteredMobile] = useState("");
    const [mobileNumbers, setMobileNumbers] = useState(null);
    const [ewi, setEwiRecipient] = useState(null);
    const [gender, setGender] = useState(null);
    const [fName, setFName] = useState(null);
    const [mName, setMName] = useState(null);
    const [lName, setLName] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [nickName, setNickName] = useState(null);
    const [emailToDelete, setEmailToDelete] = useState([]);
    const gend = gender === "M" || gender === "m" ? "Male" : "Female";
    const mobile_number_mask = ["(", "+", "6", "3", "9", ")", " ", /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
    useEffect(() => {
        const contact_nums = mobile_numbers.map(data => {
            const nums = {
                sim: data.mobile_number.sim_num, 
                status: data.status,
                gsm_id: data.mobile_number.gsm_id,
                priority: data.priority,
                mobile_id: data.mobile_number.mobile_id
            };
            return nums;
        });
        setMobileNumbers(contact_nums);
        setEmails(emails);
        setGender(sex);
        setFName(first_name);
        setMName(middle_name);
        setLName(last_name);
        setNickName(nickname);
        setEwiRecipient(ewi_recipient);
        setUserStatus(status);
    }, [selectedUserDetails]);

    const handleClose = () => {
        setShiftopen(false);
    };

    const handleOpen = () => {
        setShiftopen(true);
    };

    const BadgeButton = () => {
        return (
            <IconButton className={classes.addPhotoButton} onClick={editMode}>
                <EditIcon color="primary"/>
            </IconButton>
        );
    };

    const editMode = () => {
        setEdit(true);
    };

    const saveEdit = () => {
        const numbers = [];
        mobileNumbers.forEach( row => {
            const unmasked = row.sim.replace(/[()+-\s]/g, "");
            const formatted = { 
                mobile_number: {
                    mobile_id: row.mobile_id,
                    gsm_id: row.gsm_id,
                    sim_num: unmasked
                },
                status: row.status,
                priority: row.priority, 
            };
            numbers.push(formatted);
        });

        const json_data = {
            user_id,
            first_name: fName,
            middle_name: mName,
            last_name: lName,
            nickname: nickName,
            sex: gender,
            emails: processedEmails,
            mobile_numbers: numbers,
            landline_numbers: [],
            delete_emails: emailToDelete,
            ewi_recipient: ewi,
            status: userStatus,
        };
        updateUserInfo(json_data, response => {
            if (response.status) {
                setEdit(false);
            }
        });
    };

    const addMobile = () => {
        if (enteredMobile.length > 0) {
            const new_numbers = mobileNumbers;
            new_numbers.push({ sim: enteredMobile, status: 1, gsm_id: 0, priority: 1, mobile_id: 0 });
            setMobileNumbers([...new_numbers]);
        }
        setEnteredMobile("");
    };

    const addEmail = () => {
        if (enteredEmail.length > 0) {
            const new_email = processedEmails;
            new_email.push({ email: enteredEmail, email_id: 0 });
            console.log([...new_email]);
            setEnteredEmail([...new_email]);            
        }
        setEnteredEmail("");
    };

    const removeEmail = (email_data) => {
        const new_email = processedEmails;
        new_email.splice(new_email.indexOf(email_data), 1);
        setEmails([...new_email]);    
        setDeleteList(email_data);
    };

    const setDeleteList = data => {
        const { email } = data;
        const onDeleteList = emailToDelete;
        if (onDeleteList.length > 0) {
            emailToDelete.forEach(row => {
                row.email !== email ? onDeleteList.push(data) : onDeleteList.push(row);
            });
        } else {
            onDeleteList.push(data);
        }
        setEmailToDelete([...onDeleteList]);
        console.log("on delete: ", [...onDeleteList]);
    };

    const genderChange = () => {
        gender === "M" || gender === "m" ? setGender("F") : setGender("M");
    };

    const format_to_mask = (number => {
        if (!number.match(/[()+-\s]/g)) {
            const formatter = new StringMask("(+000) 00-000-0000");
            const result = formatter.apply(number); // +639 (31) 222-2222
            return result;
        }
        return number;
    });

    const activate = (sim) => {
        const altered = [];
        mobileNumbers.forEach(row => {
            if (row.sim === sim) {
                const new_status = row.status === 0 ? 1 : 0;  
                altered.push({ 
                    sim, 
                    status: new_status, 
                    gsm_id: row.gsm_id, 
                    priority: row.priority, 
                    mobile_id: row.mobile_id });
            } else {
                altered.push({ 
                    sim: row.sim, 
                    status: row.status, 
                    gsm_id: row.gsm_id, 
                    priority: row.priority, 
                    mobile_id: row.mobile_id });
            }
        });
        setMobileNumbers(altered);
    };

    const editEmail = (email, email_id) => {
        if (email.length > 0) {
            const updated_emails = [];
            processedEmails.forEach(row => {
                if (row.email_id === email_id) {
                    updated_emails.push({ email_id, email });
                } else {
                    updated_emails.push(row);
                }
            });
            setEmails(updated_emails);            
        }
    };

    const profile_pic = "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-user-image-179582665.jpg";

    return (
        <Grid container>
            <Grid item xs={12}>
                <Card className={classes.wall}>
                    <CardMedia
                        className={classes.media}
                        image= {Dyna_Wall}
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
                        { isUser && isEdit ? 
                            (
                                <div>
                                    <TextField value={fName} onChange={e => setFName(e.target.value)} label="First name"/>
                                    <TextField value={mName} onChange={e => setMName(e.target.value)} label="Middle name"/>
                                    <TextField value={lName} onChange={e => setLName(e.target.value)} label="Last name"/>
                                    <TextField value={nickName} onChange={e => setNickName(e.target.value)} label="Nickname"/>
                                </div>     
                            )
                            : 
                            (
                                <div>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        {`${fName} ${mName === "NA" ? "" : mName} ${lName}`}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" component="p">
                                        {nickName}
                                    </Typography>
                                </div>
                            )
                        }
                    </CardContent>
                    { isUser && !isEdit &&
                        <CardActions>
                            <Hidden mdUp>
                                <Button size="small" startIcon={<EventIcon/>} color="primary" onClick={handleOpen}>
                                    Shifts
                                </Button>
                                <Link to= "/profile/update" style={{ textDecoration: "none" }}>
                                    <Button size="small" startIcon={<LockIcon/>} color="primary">
                                        Change password
                                    </Button>
                                </Link>  
                            </Hidden>
                        </CardActions>
                    }
                </Card>
                <Grid item xs={12}>
                    <Paper>
                        <Grid container>
                            <Grid item md={6} xs={12}>
                                <List component="nav" aria-label="details">
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon/>
                                        </ListItemIcon>                
                                        <ListItemText primary="Contact Numbers" /> 
                                    </ListItem>
                                    { mobileNumbers !== null && mobileNumbers.map( mobile_number => {
                                        // eslint-disable-next-line no-shadow
                                        const { sim, status } = mobile_number;
                                        return ( 
                                            <ListItem key={sim} >            
                                                <ListItemText 
                                                    primary={format_to_mask(sim)}
                                                    secondary={status === 0 ? "inactive" : "active"}
                                                /> 

                                                {isUser && isEdit &&
                                                     (
                                                         <Checkbox 
                                                             onChange={e=> activate(sim, status)}
                                                             checked={status !== 0}
                                                             color="primary"
                                                         />
                                                     )
                                                }
                                            </ListItem>
                                        );     
                                    })}
                                    { isUser && isEdit && (
                                        <div>
                                            <ListItem >                                                        
                                                <TextField 
                                                    value={enteredMobile} 
                                                    onChange={e=> setEnteredMobile(e.target.value)} 
                                                    InputProps={{
                                                        inputComponent: TextMaskCustom,
                                                        inputProps: { mask: mobile_number_mask }
                                                    }}
                                                /> 
                                                <ListItemIcon>
                                                    <IconButton onClick={addMobile}>
                                                        <AddCircleIcon color="secondary"/>
                                                    </IconButton>
                                                </ListItemIcon>      
                                            </ListItem>   
                                        
                                            <Divider/>
                                        </div>
                                    )}
                                    <Divider/>
                                    <ListItem>
                                        <ListItemIcon>
                                            <EmailIcon/>
                                        </ListItemIcon>                 
                                        <ListItemText primary="Emails" /> 
                                    </ListItem>
                                    { processedEmails.map( row => {
                                        const { email, email_id } = row;
                                        return ( 
                                            <ListItem key={email_id}>    
                                                {!isEdit &&          
                                                    <ListItemText primary={email} /> 
                                                }
                                                {isUser && isEdit && (
                                                    <div>
                                                        <TextField
                                                            value={email}
                                                            onChange={e=>editEmail(e.target.value, email_id)}
                                                        />
                                                        <IconButton onClick={e => removeEmail(row)}>
                                                            <ListItemIcon >
                                                                <HighlightOffIcon color="error"/>
                                                            </ListItemIcon>   
                                                        </IconButton>
                                                    </div>
                                                )}
                                            </ListItem>
                                        );
                                    })}

                                    { isUser && isEdit && (     
                                        <ListItem>                                                        
                                            <TextField value={enteredEmail} onChange={e=> setEnteredEmail(e.target.value)} label="email" /> 
                                            <ListItemIcon>
                                                <IconButton onClick={addEmail}>
                                                    <AddCircleIcon color="secondary"/>
                                                </IconButton>
                                            </ListItemIcon>      
                                        </ListItem>          
                                    )}

                                    <Divider/>

                                    { !isEdit && (
                                        <ListItem >
                                            <ListItemIcon>
                                                <WcIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary={gend} />
                                        </ListItem>
                                    )}

                                    { isUser && isEdit && (     
                                        <ListItem>     
                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={gender}
                                                onChange={genderChange}
                                            >
                                                <MenuItem value="M">Male</MenuItem>
                                                <MenuItem value="F">Female</MenuItem>
                                            </Select>
                                            <ListItemIcon>
                                                <WcIcon/>
                                            </ListItemIcon>  
                                        </ListItem>     
                                    )}
                                </List>

                                { 
                                    isEdit && isUser && (
                                        <Button color="secondary" style={{ marginBottom: 2 }} variant="contained" onClick={saveEdit}>
                                            save changes
                                        </Button>
                                    )
                                }
                            </Grid>
                        </Grid>
                    </Paper>
                    {
                        isUser && (
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
                                            {/* <MyShifts /> */}
                                        </Grid>
                                    </Grid>
                                </Dialog>
                            </Hidden>
                        )}
                </Grid>
            </Grid>
        </Grid>
    );
}
export default ProfilePage;

