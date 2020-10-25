import React, { Fragment, useState } from "react";
import { IconButton, TextField, makeStyles, Typography, Grid } from "@material-ui/core";
import { SendRounded, MoreVert } from "@material-ui/icons";
import LoadTemplateModal from "./LoadTemplateModal";

const useStyles = makeStyles(theme => ({
    textBox: {
        width: "100%",
        flexGrow: 2,
        margin: 0,
    }
}));

function MessageInputTextbox (props) {
    const {
        limitRows, value, disableSend,
        messageChangeHandler, sendButtonClickHandler,
        setComposedMessage, disableTemplateLoader
    } = props;
    const classes = useStyles();
    const limit = limitRows === undefined ? true : limitRows;
    const [is_modal_open, set_is_modal_open] = useState(false);

    const setIsModalOpen = bool => () => set_is_modal_open(bool);

    return (
        <Fragment>
            <Grid container spacing={1} alignItems="center" style={{ paddingTop: 16 }}>
                <Grid item xs={10} sm={11}>
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
                        inputProps={{ maxLength: 1000 }}
                        maxLe
                        value={value}
                        onChange={messageChangeHandler}
                    />
                    <Typography variant="caption" align="right" component="div">
                        <strong>Character count: {value.length}/1000</strong>
                    </Typography>        
                </Grid>

                <Grid item xs container direction="column">
                    <IconButton
                        color="primary"
                        aria-label="Send message"
                        onClick={sendButtonClickHandler}
                        disabled={disableSend}
                    >
                        <SendRounded />
                    </IconButton>
                    {
                        !disableTemplateLoader && (
                            <IconButton
                                color="primary"
                                aria-label="More options"
                                onClick={setIsModalOpen(true)}
                            >
                                <MoreVert />
                            </IconButton>
                        )
                    }
                </Grid>
            </Grid>

            <LoadTemplateModal
                isOpen={is_modal_open} 
                setComposedMessage={setComposedMessage}
                clickHandler={setIsModalOpen(false)}
            />
        </Fragment>
    );
}

export default MessageInputTextbox;
