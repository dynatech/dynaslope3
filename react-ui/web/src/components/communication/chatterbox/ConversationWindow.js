import React, { Fragment, useState, useEffect, useRef } from "react";

import { 
    IconButton, Typography, Divider,
    Grid, Chip, makeStyles, Avatar,
    Button, Menu, MenuItem
} from "@material-ui/core";
import { KeyboardArrowLeft, MoreVert } from "@material-ui/icons";

import ContentLoader from "react-content-loader";
import { useSnackbar } from "notistack";

import ChatThread from "./ChatThread";
import GeneralStyles from "../../../GeneralStyles";
import MessageInputTextbox from "./MessageInputTextbox";
import GenericAvatar from "../../../images/generic-user-icon.jpg";
import { simNumFormatter } from "../../../UtilityFunctions";
import { 
    receiveMobileIDRoomUpdate,
    removeReceiveMobileIDRoomUpdateListener
} from "../../../websocket/communications_ws";
import { mobileUserFormatter } from "./MessageList";
import { sendMessage } from "../ajax";
import { getCurrentUser } from "../../sessions/auth";
import SaveContactModal from "./SaveContactModal";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        regularContainer: {
            ...gen_style.pageContentMargin,
            margin: 0,
            padding: "16px 0"
        },
        chatInputContainer: {
            ...gen_style.pageContentMargin
        },
        divider: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        sticky: {
            position: "sticky",
            top: 56,
            [theme.breakpoints.up("sm")]: {
                top: 63
            },
            [theme.breakpoints.up("md")]: {
                top: 118
            },
            backgroundColor: "white",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            zIndex: 3
        },
        chatHead: {
            paddingLeft: 8,
            [theme.breakpoints.up("md")]: {
                paddingLeft: 0
            },
            display: "flex",
            alignItems: "center"
        },
        backButton: {
            padding: 0,
            marginRight: 12
        },
        backIcon: {
            width: 40,
            height: 40
        },
        noFlexGrow: { flexGrow: 0 }
    };
});

const AvatarWithText = () => (
    <ContentLoader 
        height={70}
        width={800}
        speed={2}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        preserveAspectRatio="xMinYMin slice"
    >
        <rect x="69" y="7" rx="4" ry="4" width="663" height="19" /> 
        <rect x="70" y="35" rx="3" ry="3" width="293" height="14" /> 
        <rect x="0" y="120" rx="3" ry="3" width="201" height="6" /> 
        <circle cx="30" cy="30" r="30" />
    </ContentLoader>
);

const ChatLoader = props => {
    return (
        <ContentLoader
            height={160}
            width={446}
            speed={2}
            primaryColor="#f3f3f3"
            secondaryColor="#ecebeb"
        >
            <circle cx="19" cy="25" r="16" />
            <rect x="39" y="12" rx="5" ry="5" width="220" height="10" />
            <rect x="40" y="29" rx="5" ry="5" width="220" height="10" />
            <circle cx="420" cy="71" r="16" />
            <rect x="179" y="76" rx="5" ry="5" width="220" height="10" />
            <rect x="179" y="58" rx="5" ry="5" width="220" height="10" />
            <circle cx="21" cy="117" r="16" />
            <rect x="45" y="104" rx="5" ry="5" width="220" height="10" />
            <rect x="45" y="122" rx="5" ry="5" width="220" height="10" />
        </ContentLoader>
    );
};
  
function RecipientFormatter (props) {
    const { mobile_details, classes, saveNumberModal } = props;
    const { user_details, sim_num } = mobile_details;
    const sim_number = simNumFormatter(sim_num);
    let sender = sim_number;
    let orgs = [];
    const [ anchorEl, setAnchor ] = useState(null);
    
    const is_unknown = user_details === null;
    if (!is_unknown) {
        const { sender: s, orgs: o } = mobileUserFormatter(user_details);
        sender = s;
        orgs = o;
    }

    const handleClick = event => {
        setAnchor(event.currentTarget);
    };

    const handleClose = () => {
        setAnchor(null);
    };

    const handleMenuClick = () => {
        setAnchor(null);
        saveNumberModal();
    };

    return (
        <Grid container alignItems="center">
            <div style={{ marginRight: 12 }}>
                <Avatar alt={sender} src={GenericAvatar} className={classes.bigAvatar} />
            </div>
            
            <div>
                <Grid 
                    container
                    spacing={0} 
                    justify="flex-start"
                    alignItems="center"
                >

                    <Grid item xs>
                        <Typography 
                            variant="body1" 
                            style={{ marginRight: 8 }}
                        >
                            {sender}
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

                {
                    !is_unknown && (
                        <Typography 
                            variant="subtitle2" 
                            color="textSecondary"
                        >
                            {sim_number}
                        </Typography>
                    )
                }
            </div>

            {
                is_unknown && (
                    <Grid 
                        container item xs
                        justify="flex-end"
                    >
                        <IconButton 
                            size="small"
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            onClick={handleClick}
                        >
                            <MoreVert/>
                        </IconButton>
                
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            getContentAnchorEl={null}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={handleClose} 
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
                        >
                            <MenuItem
                                style={{ 
                                    fontSize: 12
                                }}
                                key="save_unknown" 
                                onClick={handleMenuClick}
                            >
                                Save unknown number
                            </MenuItem>
                        </Menu>
                    </Grid>
                )
            }
        </Grid>
    );
}

const goBack = history => e => {
    e.preventDefault();
    history.goBack();
};

function ConversationWindow (props) {
    const {
        history,
        match: { params: { mobile_id } },
        location: { state: { async } },
        messageCollection, socket
    } = props;
    const classes = useStyles();
    const current_user = getCurrentUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [open_save_contact_modal, setSaveContactModal] = useState(false);
    const [conversation_details, setConversationDetails] = useState({
        message_list: null,
        mobile_details: {}
    });
    const [composed_message, setComposedMessage] = useState("");
    const handle_message_fn = event => setComposedMessage(event.target.value);

    useEffect(() => {
        if (async && typeof socket !== "undefined") {
            socket.emit("join_mobile_id_room", mobile_id);

            receiveMobileIDRoomUpdate(data => {
                const { mobile_details, messages } = data;
                setConversationDetails({
                    mobile_details,
                    message_list: messages
                });
            });
        }

        return () => {
            if (async && typeof socket !== "undefined") {
                socket.emit("leave_mobile_id_room", mobile_id);
                removeReceiveMobileIDRoomUpdateListener();
            }
        };
    }, [socket]);

    let { mobile_details, message_list } = conversation_details;

    if (!async) {
        const { inbox } = messageCollection;
        if (inbox !== null) {
            const message_arr = [...messageCollection.inbox];
            const filtered = message_arr.filter(row => row.mobile_details.mobile_id === parseInt(mobile_id, 10));

            if (filtered.length > 0) {
                const convo = filtered.pop();
                const { mobile_details: mb, messages } = convo;
            
                mobile_details = mb;
                message_list = messages;
            }
        }
    }

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const on_send_message_fn = () => {
        const { mobile_id: m_id, gsm_id } = mobile_details;

        const formatted_message = `${composed_message} - ${current_user.nickname} from PHIVOLCS-DYNASLOPE`;

        const payload = {
            sms_msg: formatted_message,
            recipient_list: [
                {
                    mobile_id: m_id,
                    gsm_id
                }
            ]
        };

        sendMessage(payload, response => {
            if (response.status) {
                enqueueSnackbar(
                    "EWI SMS Sent!",
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
                setComposedMessage("");
            } else {
                enqueueSnackbar(
                    response.message,
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        }, () => {
            enqueueSnackbar(
                "Error sending EWI SMS...",
                {
                    variant: "error",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        });
    };

    const saveNumberModal = () => {
        setSaveContactModal(true);
    };

    const convo_end_ref = useRef(null);
    const [scrollToBottom, setScrollToBottom] = useState(false);
    useEffect(() => {
        convo_end_ref.current.scrollIntoView();
    }, [scrollToBottom]);

    return (
        <Fragment>
            {
                message_list === null
                    ? <div 
                        className={classes.regularContainer} 
                        style={{ paddingLeft: 16, paddingBottom: 0 }}
                    >
                        <AvatarWithText />
                    </div>
                    : <div className={`${classes.regularContainer} ${classes.sticky}`}>
                        <div className={classes.chatHead}>
                            <IconButton
                                aria-label="Back"
                                color="primary"
                                className={classes.backButton}
                                onClick={goBack(history)}
                            >
                                <KeyboardArrowLeft className={classes.backIcon} />
                            </IconButton>
                     
                            <RecipientFormatter 
                                mobile_details={mobile_details}
                                classes={classes} 
                                saveNumberModal={saveNumberModal}/>
                        </div>
                    </div>
            }

            <div className={classes.regularContainer}>
                { 
                    message_list === null
                        ? <div style={{ padding: "0 16px" }}><ChatLoader style={{ height: "100%" }} /></div>
                        : <ChatThread message_list={message_list} mobileDetails={mobile_details} setScrollToBottom={setScrollToBottom}/>
                }
            </div>

            {
                message_list !== null && (
                    <Fragment>
                        <Divider className={classes.divider}/>

                        <div className={classes.chatInputContainer}>
                            <MessageInputTextbox 
                                value={composed_message}
                                disableSend={composed_message === ""}
                                messageChangeHandler={handle_message_fn}
                                sendButtonClickHandler={on_send_message_fn}
                            />
                        </div>
                    </Fragment>
                )
            }

            <div 
                style={{ "float": "left", clear: "both" }}
                ref={convo_end_ref} 
            />

            <SaveContactModal
                open={open_save_contact_modal}
                setSaveContactModal={setSaveContactModal}
                mobileDetails={mobile_details}
            />
        </Fragment>
    );
}

export default ConversationWindow;
