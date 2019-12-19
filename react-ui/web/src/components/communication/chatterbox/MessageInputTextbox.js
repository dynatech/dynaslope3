import React, { Fragment, useState } from "react";
import { IconButton, TextField, makeStyles } from "@material-ui/core";
import { SendRounded, MoreVert } from "@material-ui/icons";
import LoadTemplateModal from "./LoadTemplateModal";

const useStyles = makeStyles(theme => ({
    container: {
        display: "flex",
        alignItems: "center",
        paddingTop: 16
    },
    textBox: {
        width: "100%",
        flexGrow: 2,
        margin: 0,
    },
    iconArea: {
        textAlign: "right",
        flexShrink: 2
    }
}));

function MessageInputTextbox (props) {
    const {
        limitRows, value, disableSend,
        messageChangeHandler, sendButtonClickHandler
    } = props;
    const classes = useStyles();
    const limit = limitRows === undefined ? true : limitRows;
    const [is_modal_open, set_is_modal_open] = useState(false);

    const set_function = bool => () => set_is_modal_open(bool);

    return (
        <Fragment>
            <div className={classes.container}>
                <TextField
                    id="message_textbox"
                    label="Message"
                    multiline
                    rows="4"
                    rowsMax={ limit ? 4 : 10 }
                    fullWidth
                    className={classes.textBox}
                    margin="dense"
                    variant="filled"
                    value={value}
                    onChange={messageChangeHandler}
                />

                <div className={classes.iconArea}>
                    <IconButton
                        color="primary"
                        aria-label="Send message"
                        onClick={sendButtonClickHandler}
                        disabled={disableSend}
                    >
                        <SendRounded />
                    </IconButton>
                    <IconButton color="primary" aria-label="More options" onClick={set_function(true)}>
                        <MoreVert />
                    </IconButton>
                </div>
            </div>

            <LoadTemplateModal isOpen={is_modal_open} clickHandler={set_function(false)}/>
        </Fragment>
    );
}

export default MessageInputTextbox;
