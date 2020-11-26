import React, { useState, useEffect, Fragment } from "react";
import { format as TimeAgo } from "timeago.js";
import {
    Grid, Button, Typography, List, ListItem,
    ListItemIcon, ListItemText, Divider,
    Hidden, SwipeableDrawer, IconButton, CircularProgress
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
// icons
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import FolderIcon from "@material-ui/icons/Folder";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import PublishIcon from "@material-ui/icons/Publish";
import ViewListIcon from "@material-ui/icons/ViewList";
import MoreVertIcon from "@material-ui/icons/MoreVert";

import { getFolders } from "../ajax";
import FileUploadDialog from "../FileDialog";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import PopupMenu from "../PopupMenu";
import { host } from "../../../config";
// end-icons

const useStyles = makeStyles((theme) => ({
    ...GeneralStyles(theme),
    root: {
        display: "flex",
        flexGrow: 1,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        overFlowY: "auto",
    },
    fab: {
        position: "fixed",
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
}));


const FolderList = (props) => {
    const { 
        data, setFolderDrawer, setOpenDialog, 
        isMobile, selectedFolder, setSelectedFolder, setParent, 
        open, handleToggle, setMenuParent
    } = props;
    return (
        <div style={{ overflow: "scroll", height: isMobile ? "100%" : "70vh", padding: 5 }}>
            <Button 
                color="primary" 
                variant="contained"
                startIcon={<CreateNewFolderIcon/>}
                style={{ borderRadius: 15 }}
                onClick={() => {
                    setOpenDialog(true); 
                    setParent("Folder");
                }} 
            >
                New
            </Button>
            <List component="nav" aria-label="main mailbox folders">
                {data !== null && data.map((folder, index) => (
                    <ListItem 
                        button = {selectedFolder !== index}
                        key={folder.folder_id}
                        onClick={() => {
                            setSelectedFolder(index);
                            setFolderDrawer(false);
                        }}
                    >
                        <ListItemIcon>
                            {selectedFolder === index ?
                                <FolderOpenIcon style={{ color: "#ff751a", fontWeight: "bold" }}/>
                                :
                                <FolderIcon style={{ color: "#ff751a" }}/>
                            }
                        </ListItemIcon>
                        <ListItemText primary={folder.folder_name} />
                        { selectedFolder === index &&
                            <IconButton 
                                ria-controls={open ? "menu-list-grow" : undefined}
                                aria-haspopup="true"
                                onClick={e=>{
                                    setMenuParent("folder");
                                    handleToggle(e, folder.folder_id);
                                }}
                            >
                                <MoreVertIcon/>
                            </IconButton>
                        }
                    </ListItem>
                ))}
            </List>
            <Divider />
        </div>
    );
};

export default function QAContainer () {
    const [anchorRef, setAnchor] = useState(null);
    const classes = useStyles();
    const [selectedFolder, setSelectedFolder] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderDrawer, setFolderDrawer] = useState(false); 
    const [parent, setParent] = useState("file");
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const [folderID, setFolderID] = useState(null);
    const [reload, setReload] = useState(false);
    const [menuparent, setMenuParent] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [deleteAction, setDeleteAction] = useState(null);
    const handleToggle = (e, id) => {
        setOpen(true);
        setAnchor(e.currentTarget);
        console.log(e.currentTarget);
    };

    const openFileLink = (type, fileData) => {
        const { link, file_id, ext, file_display_name } = fileData;
        if (type === "link") {
            window.open(link);
        } else {
            window.location.assign(`${host}/api/download?f=${file_id}&fdn=${file_display_name}&t=${ext}`);
        }
    };

    useEffect(() => {
        if (data) { 
            setFolderName(data[selectedFolder].folder_name);
            setFolderID(data[selectedFolder].folder_id);
        }
    }, [data]);

    useEffect(() => {
        if (data) {
            setFolderName(data[selectedFolder].folder_name);
            setFolderID(data[selectedFolder].folder_id);
        }
    }, [selectedFolder]);

    useEffect(() => {
        getFolders(result => {
            if (result) {
                setData(result);
            }
        });
    }, []);

    useEffect(() => {
        getFolders(result => {
            if (result) {
                setData(result);
                setReload(false);
            }
        });
    }, [reload]);

    return (
        <Fragment>
            <FileUploadDialog 
                open={openDialog} 
                setOpen={setOpenDialog}
                folderName={folderName}
                folderID={folderID}
                parent={parent}
                setReload={setReload}
                menuparent={menuparent}
                setMenuParent={setMenuParent}
                selectedFile={selectedFile}
                deleteAction={deleteAction}
            />  
            <div className={classes.pageContentMargin}>
                <PageTitle 
                    title={
                        <span>Knowledge | Papers {
                            data === null && <CircularProgress style={{ width: 12, height: 12 }}/>}
                        </span> }
                    customButtons={
                        <Button 
                            color="secondary"
                            variant="contained"
                            size="small"
                            endIcon={<PublishIcon/>}
                            onClick={() => {
                                setOpenDialog(true); 
                                setParent("File");
                            }} >
                            Upload
                        </Button>
                    }
                />
            </div>
            <div className={classes.pageContentMargin} style={{ height: "70vh" }}>
                <Grid container spacing={2}>
                    <Hidden smDown>
                        <Grid item md={3} xs={12}>
                            <FolderList 
                                setFolderDrawer={setFolderDrawer} 
                                setSelectedFolder={setSelectedFolder}
                                selectedFolder={selectedFolder}
                                setOpenDialog={setOpenDialog}
                                data={data}
                                setParent={setParent}
                                parent={parent}
                                handleToggle={handleToggle}
                                open={open}
                                setMenuParent={setMenuParent}
                            />
                        </Grid>
                    </Hidden>
                    <Grid item md={9} xs={12}>
                        <List component="nav" aria-label="main mailbox folders">
                            <Hidden mdUp>
                                <IconButton onClick={()=>setFolderDrawer(true)}>
                                    <ViewListIcon color="primary"/>
                                </IconButton>
                            </Hidden>
                            <Typography color="textSecondary" variant="overline" >
                                {`Total record(s): ${data !== null && data[selectedFolder].files.length}`}
                            </Typography>
                            {data !== null && data[selectedFolder].files.map((file, index) => {

                                const { 
                                    record_type, ext, file_id, 
                                    file_display_name, ts_uploaded,
                                    modified_by 
                                } = file;
                                return (
                                    <div>
                                        <ListItem key={file.file_id}>
                                            <ListItemIcon>
                                                <Typography>{`${index + 1}.  `}</Typography>
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={`${file_display_name}${ext !== null ? ext : ""}`} 
                                                secondary={`updated by ${modified_by} ${TimeAgo(ts_uploaded)}`} 
                                            />
                                            <Button 
                                                onClick={e=>openFileLink(record_type, file)} 
                                                size="small" 
                                                color="primary" 
                                                style={{ textTransform: "none", width: 100 }}
                                            >
                                                {record_type === "link" ? "open" : "download"}
                                            </Button>
                                            <IconButton 
                                                ria-controls={open ? "menu-list-grow" : undefined}
                                                aria-haspopup="true"
                                                onClick={e=>{
                                                    handleToggle(e, file_id);
                                                    setMenuParent("file");
                                                    setSelectedFile(file);
                                                }}
                                            >
                                                <MoreVertIcon/>
                                            </IconButton>
                                        </ListItem>
                                        <Divider/>
                                    </div>
                                );
                            })}
                        </List>
                    </Grid>
                </Grid>
            </div>
            <SwipeableDrawer
                anchor="left"
                open={folderDrawer}
                onClose={() => setFolderDrawer(false)}
                onOpen={() => setFolderDrawer(true)}
            >
                <FolderList 
                    setFolderDrawer={setFolderDrawer} 
                    setSelectedFolder={setSelectedFolder}
                    selectedFolder={selectedFolder}
                    setOpenDialog={setOpenDialog}
                    data={data}
                    isMobile
                    setParent={setParent}
                    parent={parent}
                    setMenuParent={setMenuParent}
                    handleToggle={handleToggle}
                    open={open}
                    setOpen={setOpenDialog}
                    folderName={folderName}
                    folderID={folderID}
                    setReload={setReload}
                    menuparent={menuparent}
                    selectedFile={selectedFile}
                    deleteAction={deleteAction}
                />
            </SwipeableDrawer> 
            <PopupMenu
                open={open}
                setOpen={setOpen}
                anchorRef={anchorRef}
                setAnchor={setAnchor}
                parent={menuparent}
                setOpenDialog={setOpenDialog}
                setDeleteAction={setDeleteAction}
            />
        </Fragment>
    ); }