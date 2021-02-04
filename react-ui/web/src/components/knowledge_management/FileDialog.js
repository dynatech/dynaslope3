import React, { useEffect, useState, useCallback, useReducer } from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { getCurrentUser } from "../sessions/auth";
//
import { 
    saveFile, create_folder, 
    rename_folder, update_file,
    delete_folder, delete_file
} from "./ajax";

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: "absolute",
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const myStyles = makeStyles((theme) => ({
    dropArea: {
        display: "flex",
        width: "100%",
        minHeight: 300,
        minWidth: 400,
        border: "3px dotted #f2f2f2",
        textAlign: "center",
        justifyContent: "center",
    }
}));

const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);

function reducer (state, action) {
    switch (action.type) {
        case "folderName":
            return { ...state, folder_name: action.value };
        case "fileName":
            return { ...state, file_name: action.value };
        case "fileID":
            return { ...state, file_id: action.value };
        case "folderID":
            return { ...state, folder_id: action.value };
        case "type":
            return { ...state, type: action.value };
        case "link":
            return { ...state, link: action.value };
        default:
            throw new Error();
    }
}



export default function UploadDialog (props) {
    const { open, setOpen, folderName, 
        parent, setReload, folderID,
        menuparent, setMenuParent, selectedFile,
        deleteAction
    } = props;
    const current_user = getCurrentUser();

    const init = {
        folder_name: "",
        file_name: "",
        file_id: "",
        folder_id: "",
        link: "",
        type: "link",
        user_id: current_user.user_id,
    };
    
    const classes = myStyles();
    const [attachedFile, setAttachedFile] = useState(null);
    const [inputs, dispatch] = useReducer(reducer, init);
    const form_data = new FormData();
  
    const handleClose = () => {
        setOpen(false);
        setMenuParent(null);
    };

    useEffect(() => {
        if (deleteAction !== null) {
            if (deleteAction === "removeFolder") {
                delete_folder({ ...inputs });
            } else if (deleteAction === "removeFile") {
                delete_file({ ...inputs });
            } 
        }
    }, [deleteAction]);


    const handleSave = () => {
        if (!menuparent && parent !== "Folder") {
            if (attachedFile !== null) form_data.append("attached_file", attachedFile);
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, value] of Object.entries(inputs)) {
                form_data.append(key, value);
            }
            saveFile(form_data);
        } 
        if (menuparent && menuparent === "folder") {
            rename_folder({ 
                ...inputs
            });
        }
        if (!menuparent && inputs.folder_name !== "") {
            create_folder({
                user_id: current_user.user_id,
                folder_name: inputs.folder_name
            });
        }
        if (menuparent && menuparent === "file") {
            update_file({ 
                ...inputs
            });
        }

        handleClose();
        setReload(true);
    };

    useEffect(() => {
        dispatch({ type: "folderID", value: folderID });
        dispatch({ type: "folderName", value: folderName });
    }, [folderID]); 

    useEffect(() => {
        if (selectedFile !== null) {
            dispatch({ type: "fileID", value: selectedFile.file_id });
            dispatch({ type: "fileName", value: selectedFile.file_display_name });
            dispatch({ type: "type", value: selectedFile.record_type });
            dispatch({ type: "link", value: selectedFile.link });
        }
    }, [selectedFile]); 

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
            setAttachedFile(file);
        });
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <Dialog onClose={handleClose} fullWidth open={open}>
            <DialogTitle id="customized-dialog-title" onClose={handleClose}>
                {
                    // eslint-disable-next-line no-nested-ternary
                    parent === "Folder" || menuparent === "folder" ? 
                        menuparent ? "Rename folder" : "Create new folder"
                        : 
                        menuparent ? "Rename file" : `Upload to "${folderName}" folder`
                }
            </DialogTitle>

            <DialogContent dividers>
                { parent === "Folder" || menuparent === "folder" ? 
                    <TextField 
                        label="enter folder name" 
                            
                        style={{ minWidth: 300 }} 
                        inputProps={{
                            maxLength: 30,
                        }}
                        value={inputs.folder_name}
                        onChange={e=> dispatch({ type: "folderName", value: e.target.value })}
                    /> : (
                        <div>
                            <Typography gutterBottom> File name</Typography>

                            <TextField 
                                placeholder="e.g. monitoring ops manual" 
                                fullWidth
                                margin="dense" 
                                onChange={e=>dispatch({ type: "fileName", value: e.target.value })}
                                variant="outlined"
                                value={inputs.file_name}
                            />
                            <FormControl component="fieldset" fullWidth margin="normal" >
                                { !menuparent &&
                                    <div> 
                                        <FormLabel component="legend">Type</FormLabel>
                                        <RadioGroup 
                                            aria-label="gender" 
                                            onChange={e=> dispatch({ type: "type", value: e.target.value })}
                                            name="gender1"
                                            value={inputs.type}
                                        >
                                            <FormControlLabel value="link" control={<Radio />} label="Link" />
                                            <FormControlLabel value="file" control={<Radio />} label="File" />
                                        </RadioGroup>
                                    </div>
                                }

                                { inputs.type === "file" ? (
                                    <div>
                                        { !menuparent && 
                                            <div {...getRootProps()} className={classes.dropArea}>
                                                <div style={{ margin: "auto" }}>
                                                    <input {...getInputProps()} />
                                                    <Typography style={{ width: "100%" }} textAlign="center" variant="h6" color="textSecondary">
                                                        Drag and drop a file here
                                                    </Typography>
                                                    <Button style={{ textTransform: "none" }} disableElevation variant="contained" startIcon={<CloudUploadIcon/>}>
                                                        {attachedFile !== null ? attachedFile.name : "Choose File"}
                                                    </Button>
                                                </div>
                                            </div>}
                                    </div>
                                ) : (
                                    <div>
                                        <TextField 
                                            variant="outlined" 
                                            value={inputs.link}
                                            onChange={e => dispatch({ type: "link", value: e.target.value })} 
                                            fullWidth placeholder="paste link here: e.g. https://drive.google.com/file/d/1......"
                                        />
                                    </div>
                                )}
                            </FormControl>
                        </div>
                    )
                }
        
            </DialogContent>
            <DialogActions>
                <Button 
                    autoFocus 
                    onClick={handleSave} 
                    color={parent === "Folder" ? "primary" : "secondary"} 
                    variant="contained"
                >
                    {parent === "Folder" ? "create" : "save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}