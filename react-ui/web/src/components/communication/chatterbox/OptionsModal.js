import React from "react";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import { SaveAlt, Block } from "@material-ui/icons";


function MessageOptionsModal (props) {
    const {
        onClose, open, isUnregistered,
        setBlockModal, setSaveContactModal
    } = props;

    const handleClose = () => {
        onClose();
    };

    const handleSave = () => {
        onClose();
        setSaveContactModal(true);
    };

    const handleBlock = () => {
        onClose();
        setBlockModal(true);
    };

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
            <DialogTitle id="simple-dialog-title">Message options</DialogTitle>
            <List>
                {
                    isUnregistered && (
                        <ListItem button onClick={handleSave}>
                            <ListItemIcon>
                                <SaveAlt />
                            </ListItemIcon>
                            <ListItemText primary="Save number" />
                        </ListItem>
                    )
                }
                <ListItem button onClick={handleBlock}>
                    <ListItemIcon>
                        <Block />
                    </ListItemIcon>
                    <ListItemText primary="Block number" />
                </ListItem>
            </List>
        </Dialog>
    );
}

export default MessageOptionsModal;