import React, { Fragment } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, IconButton,
    Grid, CircularProgress, 
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { useSnackbar } from "notistack";

import { getCurrentUser } from "../../sessions/auth";
import MessageInputTextbox from "../../communication/chatterbox/MessageInputTextbox";

import { sendRoutineEwiMessage } from "../../communication/ajax";

import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";

function SendRoutineMessageForm (props) {
    const {
        is_loading_recipients, textboxValue,
        sendHandler
    } = props;

    return (
        <Fragment>
            <Grid container justify="space-around" alignItems="flex-end">
                {
                    is_loading_recipients && (
                        <Grid item xs={1}>
                            <CircularProgress size={20} />
                        </Grid>
                    )
                }
            </Grid>

            <div style={{ marginTop: 16 }}>
                <MessageInputTextbox
                    limitRows={false}
                    value={textboxValue}
                    disableSend={false}
                    sendButtonClickHandler={sendHandler}
                    messageChangeHandler={() => console.log("tried msg change")}
                />
            </div>
                
        </Fragment>
    );
}

function SendRoutineEwiSmsModal (props) {
    const {
        fullScreen, modalStateHandler,
        modalState, textboxValue, siteList
    } = props;

    // const { release_id, site_code } = releaseDetail;
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const sendHandler = () => {
        const { user_id, nickname } = getCurrentUser();
        const input = {
            site_list: siteList,
            user_id,
            nickname 
        };
        modalStateHandler();
        sendRoutineEwiMessage(input, response => {
            console.log(response.message);

            if (response.status) {
                enqueueSnackbar(
                    "EWI SMS Sent!",
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
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
        }, error_response => {
            console.log("error_response", error_response);
            enqueueSnackbar(
                "Error sending Routine EWI SMS...",
                {
                    variant: "error",
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
        });

    };
    
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
                    <span>Send Routine Early Warning Information</span>
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
                    Early warning information recipients for this site is already pre-loaded. Recipients are LEWC, Barangay, and Municipal LGUs per site. If you need to add a new recipient, add a new community contact via chatterbox.
                </DialogContentText>
                        
                <div style={{ marginTop: 20 }}>
                    <SendRoutineMessageForm
                        isMobile={fullScreen}
                        textboxValue={textboxValue}
                        disableQuickSelect
                        sendHandler={sendHandler}
                        fromEWIModal
                        updateSentStatusObj=""
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

export default withMobileDialog()(SendRoutineEwiSmsModal);
