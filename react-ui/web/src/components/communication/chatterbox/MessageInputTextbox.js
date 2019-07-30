import React, { Fragment, useState } from "react";
import { IconButton, TextField } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { SendRounded, MoreVert } from "@material-ui/icons";
import LoadTemplateModal from "./LoadTemplateModal";

const styles = theme => ({
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
});

function MessageInputTextbox (props) {
    const { classes, limitRows } = props;
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
                />

                <div className={classes.iconArea}>
                    <IconButton color="primary" aria-label="Send message">
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

export default withStyles(styles)(MessageInputTextbox);
