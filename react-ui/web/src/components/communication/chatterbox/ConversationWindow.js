import React, { Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
import { IconButton, Typography, Divider } from "@material-ui/core";
import { KeyboardArrowLeft } from "@material-ui/icons";
import ChatThread from "./ChatThread";

const styles = theme => ({
    root: {
        margin: 16 
    },
    chatHead: {
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
    }
});

const goBack = (history, backHandler) => (e) => {
    e.preventDefault();
    backHandler();
    history.goBack();
};

function ConversationWindow (props) {
    const { classes, history, backHandler } = props;

    return (
        <Fragment>
            <div className={classes.root}>
                <div className={classes.chatHead}>
                    <IconButton
                        aria-label="Back"
                        color="primary"
                        className={classes.backButton}
                        onClick={goBack(history, backHandler)}
                    >
                        <KeyboardArrowLeft className={classes.backIcon} />
                    </IconButton>

                    <Typography variant="subtitle2">
                        PAR PLGU Cathleen Joyce Cordero
                        <Typography variant="caption" color="textSecondary">
                            +639773092218
                        </Typography>
                    </Typography>
                </div>
            </div>

            <Divider />

            <div className={classes.root}>
                <ChatThread />
            </div>
        </Fragment>
    );
}

export default withStyles(styles)(ConversationWindow);
