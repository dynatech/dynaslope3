import React, {
    Fragment, useState,
    useEffect
} from "react";

import { makeStyles } from "@material-ui/core/styles";
import {
    Button, Grid, Typography,
    List, ListItem, ListItemAvatar,
    ListItemText, ListItemSecondaryAction, IconButton,
    Avatar, TextField, Hidden,
    ListItemIcon, Chip,
    Paper, Divider, Slide,
    Backdrop, Tooltip, AppBar,
    Toolbar, Dialog, TextareaAutosize
} from "@material-ui/core";

import { Refresh, SaveAlt, Send } from "@material-ui/icons";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 16
        },
        sticky: {
            position: "sticky",
            top: 146,
            [theme.breakpoints.down("sm")]: {
                top: 48
            },
            backgroundColor: "white",
            // borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            zIndex: 1
        },
        noFlexGrow: { flexGrow: 0 },
        paper: {
            position: "fixed",
            right: 0,
            top: 116,
            height: "100%",
            width: 400
        },
        overflow: {
            overflowY: "auto",
            height: 760,
            [theme.breakpoints.down("md")]: {
                height: 570
            }
        },
        insetDivider: { padding: "8px 70px !important" }
    }; 
});


function MailBoxContainer (props) {
    const classes = useStyles();
    const { siteId } = props;
    const [recipients, setRecipients] = useState({
        to: [], cc: [], bcc: []
    });
    const [sender, setSender] = useState("");
    const [subject, setSubject] = useState("");
    const [mail_body, setMailBody] = useState("");
    const [toggled_cc, setToggledCC] = useState(false);
    const [toggled_bcc, setToggledBCC] = useState(false);

    const recipientChangeHandler = key => event => {
        console.log("event", event);
        const { data } = event.target;

        const temp = recipients[key].push(data);
        
        setRecipients({
            ...recipients,
            ...temp
        });
    };

    const handleSend = () => {
        console.log("Send Clicked");
    };

    const handleDiscard = () => {
        console.log("Discard Clicked");
    };

    // const handleToggles = key => event => {
    //     if (key === "cc") ;
    //     else if (key === "bcc") setToggledBCC(!toggled_bcc);
    // };
    const config = {
        toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "|", "undo", "redo"]
    };

    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | MailBox" 
                // customButtons={
                //     (
                //         <Fragment>
                //             <Button onClick={ret => setToggledCC(!toggled_cc)}>Cc</Button>
                //             <Button onClick={ret => setToggledBCC(!toggled_bcc)}>Bcc</Button>
                //         </Fragment>
                //     )
                // }
            />
            <Grid container spacing={4}>
                <Grid item xs={12} container spacing={1} key="sending_options">
                    <Grid item xs={6} >
                        <TextField
                            label="To"
                            value={recipients.to}
                            onChange={recipientChangeHandler("to")}
                            margin="dense"
                            required
                            error={recipients.to === ""}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={6} >
                        <TextField
                            label="Subject"
                            value={subject}
                            onChange={ret => setSubject(ret)}
                            margin="dense"
                            required
                            error={subject === ""}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={6} >
                        <TextField
                            label="Cc"
                            value={recipients.cc}
                            onChange={recipientChangeHandler("cc")}
                            margin="dense"
                            required
                            error={recipients.cc === ""}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={6} >
                        <TextField
                            label="Bcc"
                            value={recipients.bcc}
                            onChange={recipientChangeHandler("bcc")}
                            margin="dense"
                            required
                            error={recipients.bcc === ""}
                            fullWidth
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} key="message_body">
                    <CKEditor
                        editor={ClassicEditor}
                        // data="<p>Hi! Starting entering data</p>"
                        config={config}
                        onInit={editor => {
                            // You can store the "editor" and use when it is needed.
                            editor.setData(mail_body);
                            console.log(Array.from(editor.ui.componentFactory.names()));
                        }}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            console.log({ event, editor, data });
                            setMailBody(data);
                        }}
                    />
                </Grid>
                <Grid item xs={12} key="buttons">
                    <Button onClick={handleSend}>SEND</Button>
                    <Button onClick={handleDiscard}>Discard/Reset</Button>
                </Grid>
            </Grid>
        </div>
    );
}

export default (MailBoxContainer);





// DUMPING MIGHT BE REUSED CODE
// {
//     toggled_cc && (
//         <Grid item xs={6} >
//             <TextField
//                 label="Cc"
//                 value={recipients.cc}
//                 onChange={recipientChangeHandler("cc")}
//                 margin="dense"
//                 required
//                 error={recipients.cc === ""}
//                 fullWidth
//             />
//         </Grid>
//     )
// }
// {
//     toggled_bcc && (
//         <Grid item xs={6} >
//             <TextField
//                 label="Bcc"
//                 value={recipients.bcc}
//                 onChange={recipientChangeHandler("bcc")}
//                 margin="dense"
//                 required
//                 error={recipients.bcc === ""}
//                 fullWidth
//             />
//         </Grid>
//     )
// }