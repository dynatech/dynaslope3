import React from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton,
    makeStyles
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import SendMessageForm from "./SendMessageForm";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

const useStyle = makeStyles(theme => ({
    dialogContent: {
        "&::-webkit-scrollbar-track": {
            boxShadow: "inset 0 0 5px grey"
        },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(127, 127, 127, 0.7)"
        }
    }
}));

function SendMessageModal (props) {
    const {
        fullScreen, modalStateHandler,
        modalState, recipientsList
    } = props;
    const classes = useStyle();

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={modalState}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}
                    
        >
            <DialogTitle id="form-dialog-title">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Send a Message</span>
                    <IconButton 
                        color="inherit" 
                        onClick={modalStateHandler}
                        aria-label="Close"
                        style={{ padding: 0 }}
                    >
                        <Close />
                    </IconButton>
                </div>
            </DialogTitle>

            <DialogContent className={classes.dialogContent}>
                <DialogContentText>
                    Choose your recipients and compose a message, then send it.
                </DialogContentText>
                        
                <div style={{ marginTop: 20 }}>
                    <SendMessageForm 
                        isMobile={fullScreen}
                        textboxValue=""
                        recipientsList={recipientsList}
                        modalStateHandler={modalStateHandler}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={modalStateHandler} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(SendMessageModal);
