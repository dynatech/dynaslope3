import React, { useState, useEffect, Fragment, useRef, createRef } from "react";
import { format as TimeAgo } from "timeago.js";

import {
    Grid, Button, Typography, List, ListItem,
    ListItemIcon, ListItemText, Divider, Fab, Tooltip,
    Zoom, Hidden, SwipeableDrawer, IconButton
} from "@material-ui/core";

import { makeStyles, useTheme } from "@material-ui/core/styles";
// icons
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import FolderIcon from "@material-ui/icons/Folder";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import PublishIcon from "@material-ui/icons/Publish";
import ViewListIcon from "@material-ui/icons/ViewList";
import LinkIcon from "@material-ui/icons/Link";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import MoreVertIcon from "@material-ui/icons/MoreVert";

import { getFolders } from "../ajax";
import FileUploadDialog from "../FileDialog";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import PopupMenu from "../PopupMenu";
import UploadDialog from "../FileDialog";
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
    const { data, setFolderDrawer, 
        setOpenDialog, isMobile, selectedFolder,
        setSelectedFolder, setParent
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
                        button key={`${index }G`}
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
    const theme = useTheme();
    const [selectedFolder, setSelectedFolder] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderDrawer, setFolderDrawer] = useState(false); 
    const [parent, setParent] = useState("file");
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);

    const transitionDuration = {
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
    };

    const handleToggle = (e) => {
        setOpen(true);
        setAnchor(e.currentTarget);
    };

    useEffect(() => {
        setFolderName(data !== null && data[selectedFolder].folder_name);
    }, []);

    useEffect(() => {
        setFolderName(data !== null && data[selectedFolder].folder_name);
    }, [selectedFolder]);

    useEffect(() => {
        getFolders(result => {
            if (result) {
                setData(result);
            }
        });
    }, []);

    return (
        <Fragment>
            <FileUploadDialog 
                open={openDialog} 
                setOpen={setOpenDialog}
                folderName={folderName}
                parent={parent}
            />
            <div className={classes.pageContentMargin}>
                <PageTitle 
                    title="Knowledge | Papers" 
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

                                const { record_type, file_display_name, ts_uploaded } = file;
                                return (
                                    <div>
                                        <ListItem key={`${index }F`}>
                                    
                                            <ListItemIcon>
                                                <Typography>{`${index + 1}.  `}</Typography>
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={file_display_name} 
                                                secondary={`Updated by Harle ${TimeAgo(ts_uploaded)}`} />
                                            <Button size="small" color="primary" style={{ textTransform: "none", width: 100 }}>
                                                {record_type === "link" ? "open link" : "view file"}
                                            </Button>
                                            <IconButton 
                                                ria-controls={open ? "menu-list-grow" : undefined}
                                                aria-haspopup="true"
                                                onClick={e=>handleToggle(e)}
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
                />
            </SwipeableDrawer>
            <PopupMenu
                open={open}
                setOpen={setOpen}
                anchorRef={anchorRef}
                setAnchor={setAnchor}
            />
        </Fragment>
    ); }