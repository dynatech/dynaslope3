import React, {
    useState
} from "react";

import { makeStyles } from "@material-ui/core/styles";
import {
    Button, Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";

import { green, red } from "@material-ui/core/colors";
import Snackbar from "@material-ui/core/Snackbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
// import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

import { sendEmail } from "./ajax";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
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
        insetDivider: { padding: "8px 70px !important" }
    }; 
});


const recip_default = {
    to: [], cc: [], bcc: []
};


function MailBoxContainer (props) {
    const classes = useStyles();
    const { siteId } = props;
    const [recipients_dict, setRecipientsDict] = useState(recip_default);
    const [is_snackbar_notif_open, set_snackbar_notif_fn] = useState(false);
    const [snack_bar_data, set_snack_bar_data] = useState({});    
    // const [sender, setSender] = useState("");
    const [subject, setSubject] = useState("");
    const [mail_body, setMailBody] = useState("");
    // const [toggled_cc, setToggledCC] = useState(false);
    // const [toggled_bcc, setToggledBCC] = useState(false);

    const handleAddChip = (key, chip) => {
        const temp = recipients_dict[key].push(chip);
        setRecipientsDict({
            ...recipients_dict,
            ...temp
        });
    };

    const handleDeleteChip = (key, chip, index) => {
        const temp = recipients_dict[key].splice( recipients_dict[key].indexOf(chip), 1 );
        setRecipientsDict({
            ...recipients_dict,
            ...temp
        });
    };

    const handleSend = () => {
        const { to, cc, bcc } = recipients_dict;

        const payload = {
            recipients: [ ...to, ...cc, ...bcc ],
            subject,
            mail_body
        };
        console.log("payload", payload);
        
        sendEmail(payload, ret => {
            console.log("AXIOS Response", ret);
            const { status } = ret;
            if (status) {
                set_snack_bar_data({ text: "Email sent!", color: green[600] });
            } else {
                set_snack_bar_data({ text: "Email sent!", color: red[600] });
            }
            set_snackbar_notif_fn(true);
        });
    };

    const handleDiscard = () => {
        setRecipientsDict({
            to: [],
            cc: [],
            bcc: []
        });
        setSubject("");
        setMailBody("");
    };

    // const handleToggles = key => event => {
    //     if (key === "cc") ;
    //     else if (key === "bcc") setToggledBCC(!toggled_bcc);
    // };
    const config = {
        // toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "|", "undo", "redo"]
        height: 500
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
            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} container spacing={1} key="sending_options">
                    <Grid item xs={12} sm={6} >
                        <ChipInput 
                            label="To"
                            value={recipients_dict.to}
                            onAdd={(chip) => handleAddChip("to", chip)}
                            onDelete={(chip, index) => handleDeleteChip("to", chip, index)}
                            fullWidth
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} >
                        <TextField
                            label="Subject"
                            value={subject}
                            onChange={ret => setSubject(ret.target.value)}
                            margin="dense"
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} >
                        <ChipInput 
                            label="Cc"
                            value={recipients_dict.cc}
                            onAdd={(chip) => handleAddChip("cc", chip)}
                            onDelete={(chip, index) => handleDeleteChip("cc", chip, index)}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} >
                        <ChipInput 
                            label="Bcc"
                            value={recipients_dict.bcc}
                            onAdd={(chip) => handleAddChip("bcc", chip)}
                            onDelete={(chip, index) => handleDeleteChip("bcc", chip, index)}
                            fullWidth
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} key="message_body">
                    <CKEditor
                        editor={ClassicEditor}
                        data={mail_body}
                        config={config}
                        onInit={editor => {
                            // You can store the "editor" and use when it is needed.
                            editor.setData(mail_body);
                            // console.log(Array.from(editor.ui.componentFactory.names()));
                            // console.log("PLUGINS: ", ClassicEditor.builtinPlugins.map( plugin => plugin.pluginName ));
                        }}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            setMailBody(data);
                        }}
                    />
                </Grid>

                <Grid item xs={12} key="buttons">
                    <Button color="secondary" onClick={handleSend}>SEND</Button>
                    <Button color="primary" onClick={handleDiscard}>Discard/Reset</Button>
                </Grid>
            </Grid>

            <Snackbar
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                open={is_snackbar_notif_open}
                autoHideDuration={6000}
                onClose={ret => set_snackbar_notif_fn(false)}
                ContentProps={{
                    "aria-describedby": "message-id",
                }}
                message={<span id="message-id">{snack_bar_data.text}</span>}
                action={[
                    <IconButton
                        key="close"
                        aria-label="close"
                        color="inherit"
                        className={classes.close}
                        onClick={ret => set_snackbar_notif_fn(false)}
                    >
                        <CloseIcon />
                    </IconButton>,
                ]}
                style={{ backgroundColor: snack_bar_data.color }}
            />
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
//                 value={recipients_dict.cc}
//                 onChange={recipientChangeHandler("cc")}
//                 margin="dense"
//                 required
//                 error={recipients_dict.cc === ""}
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
//                 value={recipients_dict.bcc}
//                 onChange={recipientChangeHandler("bcc")}
//                 margin="dense"
//                 required
//                 error={recipients_dict.bcc === ""}
//                 fullWidth
//             />
//         </Grid>
//     )
// }