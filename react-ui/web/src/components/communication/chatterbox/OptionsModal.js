import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import { blue } from "@material-ui/core/colors";
import { SaveAlt, Block } from "@material-ui/icons";

const emails = ["username@gmail.com", "user02@gmail.com"];
const useStyles = makeStyles({
    avatar: {
        backgroundColor: blue[100],
        color: blue[600],
    },
});

function MessageOptionsModal (props) {
    const classes = useStyles();
    const {
        onClose, open, isUnregistered,
        setBlockModal
    } = props;

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
            <DialogTitle id="simple-dialog-title">Message options</DialogTitle>
            {/* <DialogContent dividers> */}
            <List>
                {
                    isUnregistered && (
                        <ListItem button onClick={() => {}}>
                            <ListItemIcon>
                                <SaveAlt />
                            </ListItemIcon>
                            <ListItemText primary="Save number" />
                        </ListItem>
                    )
                }
                <ListItem button onClick={() => setBlockModal(true)}>
                    <ListItemIcon>
                        <Block />
                    </ListItemIcon>
                    <ListItemText primary="Block number" />
                </ListItem>
            </List>
            {/* </DialogContent> */}
        </Dialog>
    );
}

export default MessageOptionsModal;