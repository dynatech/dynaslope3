import React from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import SendMessageForm from "../../communication/chatterbox/SendMessageForm";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

function SendMessageModal (props) {
    const {
        fullScreen, modalStateHandler,
        modalState, textboxValue
    } = props;
    
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
                    <span>Send Early Warning Information</span>
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
            <DialogContent style={{ overflowY: "hidden" }}>
                <DialogContentText>
                    Early warning information recipients for this site is already pre-loaded. Add additional site-related contacts
                    if necessary. Use Chatterbox for non-site-related contacts.
                </DialogContentText>
                        
                <div style={{ marginTop: 20 }}>
                    <SendMessageForm
                        isMobile={fullScreen}
                        textboxValue={textboxValue}
                        disableQuickSelect
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
