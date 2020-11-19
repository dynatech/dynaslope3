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
import AttachmentIcon from "@material-ui/icons/Attachment";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";

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
        default:
            throw new Error();
    }
}

const init = {
    folder_name: "",
    file_name: "",
    file_id: "",
    folder_id: "",
    link: "",
    type: "file",
};
export default function UploadDialog (props) {
    const { open, setOpen, folderName, parent } = props;
    const classes = myStyles();
    const [type, setUploadType] = useState("link");
    const [attachedFile, setAttachedFile] = useState(null);

    const [inputs, dispatch] = useReducer(reducer, init);

    useEffect(() => {
        console.log(inputs);
    }, [inputs]);

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleFileChange = event => {
        const { files } = event.target;
        setAttachedFile(files.item(0));
    };

    useEffect(() => {
        if (attachedFile !== null ) {
            console.log(attachedFile.name);
        }
    }, [attachedFile]);

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
            setAttachedFile(file);
        });
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div>
            <Dialog onClose={handleClose} maxWidth={parent === "file" ? "md" : "sm"} open={open}>
                <DialogTitle id="customized-dialog-title" onClose={handleClose}>
                    <Typography variant="caption">
                        {parent === "Folder" ? "Create new folder" : 
                            `Upload file/link to ${folderName} folder`
                        }
           
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    { parent === "Folder" ? 
                        <TextField 
                            label="Folder name" 
                            variant="outlined"
                            style={{ minWidth: 300 }} 
                            inputProps={{
                                maxLength: 30,
                            }}
                            onChange={e=> dispatch({ type: "folderName", value: e.target.value })}
                        /> : (
                            <div>
                                <Typography gutterBottom>
                                    File name
                                </Typography>
                                <TextField 
                                    placeholder="e.g. monitoring ops manual" 
                                    fullWidth
                                    margin="dense" 
                                    variant="outlined"/>
                                <FormControl component="fieldset" fullWidth margin="normal" >
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
                                    {inputs.type === "file" ? (
                                        <div {...getRootProps()} className={classes.dropArea}>
                                            <div style={{ margin: "auto" }}>
                                                <input {...getInputProps()} />
                                                <Typography style={{ width: "100%" }} textAlign="center" variant="h6" color="textSecondary">
                                                    Drag and a drop file here
                                                </Typography>
                                                <Button style={{ textTransform: "none" }} disableElevation variant="contained" startIcon={<CloudUploadIcon/>}>
                                                    {attachedFile !== null ? attachedFile.name : "Choose File"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <TextField variant="outlined" fullWidth placeholder="paste link here: e.g. https://drive.google.com/file/d/1......"/>
                                        </div>
                                    )}
                                </FormControl>
                            </div>
                        )
                    }
        
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={handleClose} color="secondary" variant="contained">
                        Save now
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}