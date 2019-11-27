import React, {
    useState
} from "react";

import { makeStyles } from "@material-ui/core/styles";
import {
    Button, Grid, TextField
} from "@material-ui/core";
import ChipInput from "material-ui-chip-input";

import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
// import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

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
    const [recipients, setRecipients] = useState(recip_default);
    // const [sender, setSender] = useState("");
    const [subject, setSubject] = useState("");
    const [mail_body, setMailBody] = useState("");
    // const [toggled_cc, setToggledCC] = useState(false);
    // const [toggled_bcc, setToggledBCC] = useState(false);

    const handleAddChip = (key, chip) => {
        console.log(key, chip);
        const temp = recipients[key].push(chip);
        console.log("temp in add", temp);
        setRecipients({
            ...recipients,
            ...temp
        });
    };

    const handleDeleteChip = (key, chip, index) => {
        console.log(key, chip, index);
        const temp = recipients[key].splice( recipients[key].indexOf(chip), 1 );
        console.log("temp in del", temp);
        setRecipients({
            ...recipients,
            ...temp
        });
    };

    const handleSend = () => {
        console.log("Send Clicked");
        const tmp_payload = {
            recipients, subject, mail_body
        };

        console.log("PAYLOAD", tmp_payload);
    };

    const handleDiscard = () => {
        console.log("Discard Clicked");
        setRecipients(recip_default);
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
            <Grid container spacing={4}>
                <Grid item xs={12} container spacing={1} key="sending_options">
                    <Grid item xs={12} sm={6} >
                        <ChipInput 
                            label="To"
                            value={recipients.to}
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
                            value={recipients.cc}
                            onAdd={(chip) => handleAddChip("cc", chip)}
                            onDelete={(chip, index) => handleDeleteChip("cc", chip, index)}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} >
                        <ChipInput 
                            label="Bcc"
                            value={recipients.bcc}
                            onAdd={(chip) => handleAddChip("bcc", chip)}
                            onDelete={(chip, index) => handleDeleteChip("bcc", chip, index)}
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