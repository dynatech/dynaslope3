import React, { useState, Fragment } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TextField } from "@material-ui/core";


export default function InputModal (props) {
    const { 
        isOpen, handleCreateFolder, handleClose,
        handleAddLink
    } = props;
    const [folder_name, setFolderName] = useState("");
    const [file_name, setFileName] = useState("");
    const [link_address, setLinkAddress] = useState("");

    let handleSubmit = null;
    let title = "";
    let body = "";
    let submit_label = "";
    if (isOpen === "create_folder") {
        title = "Enter folder name";
        submit_label = "Create";
        body = <TextField 
            fullWidth
            margin="dense"
            value={folder_name}
            onChange={e => setFolderName(e.target.value)}
        />;
        handleSubmit = () => { 
            handleCreateFolder(folder_name);
            setFolderName("");
        };
    } else if (isOpen === "add_link") {
        title = "Add link";
        submit_label = "Add";
        body = <Fragment>
            <TextField 
                label="File Name"
                fullWidth
                margin="dense"
                value={file_name}
                onChange={e => setFileName(e.target.value)}
            />

            <TextField 
                label="Link Address"
                fullWidth
                margin="dense"
                value={link_address}
                onChange={e => setLinkAddress(e.target.value)}
            />
        </Fragment>;
        handleSubmit = () => {
            handleAddLink({ file_name, link: link_address });
            setFileName("");
            setLinkAddress("");
        };
    }

    return (
        <Dialog
            open={isOpen !== ""}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth
        >
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Make sure to add a working link address.
                </DialogContentText>
                {body}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSubmit} color="primary">
                    {submit_label}
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
