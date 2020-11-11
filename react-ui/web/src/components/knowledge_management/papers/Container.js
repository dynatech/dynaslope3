import React, { useState, useEffect, Fragment } from "react";

import {
    Grid, Button, FormHelperText,
    CircularProgress, Select, MenuItem,
    FormControl, Paper, Typography, List, ListItem,
    ListItemIcon, ListItemText, Divider, Fab, Tooltip,
    Zoom, Hidden, SwipeableDrawer, IconButton
} from "@material-ui/core";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../../components/reusables/PageTitle";
import FileUploadDialog from "../FileDialog";

//icons
import FileCopyIcon from '@material-ui/icons/FileCopy';
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import FolderIcon from '@material-ui/icons/Folder';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import PublishIcon from '@material-ui/icons/Publish';
import ViewListIcon from '@material-ui/icons/ViewList';
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
        position: 'fixed',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
      },
}));

const TabComponents = (props) => {
    const { 
        selectedTab
    } = props;

    const components = [

    ];
    return components[selectedTab];
};

function ListItemLink(props) {
    return <ListItem button component="a" {...props} />;
  }

  const dataFromDB = [
        {
            title :"Monitoring Operations",
            files: [
                {
                    fileName: "Monitoring Manual",
                    link: "",
                },
                {
                    fileName: "PLAA Reports",
                    link: "",
                }
            ]
        }, 
        {
            title :"PLAA",
            files: [
                {
                    fileName: "Monitoring Manual",
                    link: "",
                },
                {
                    fileName: "PLAA Reports",
                    link: "",
                },
                {
                    fileName: "Monitoring Manual",
                    link: "",
                },
                {
                    fileName: "PLAA Reports",
                    link: "",
                }
            ]
        }, 
       
    ];

    const FolderList = (props) => {
        const { data, setFolderDrawer, setFolderName, 
            setOpenDialog, isMobile, selectedFolder,
            setSelectedFolder, setParent, parent
        } = props;
        return (
        <div style={{ overflow:"scroll", height: isMobile ? "100%" : "70vh", padding:5}}>
            <Button 
                color="primary" 
                variant="contained"
                startIcon={<CreateNewFolderIcon/>}
                style={{borderRadius:15}}
                onClick={() => {
                    setOpenDialog(true); 
                    setParent("Folder");
                }} 
                >
                    New
            </Button>
            <List component="nav" aria-label="main mailbox folders">
                {data.map((row, index) => (
                    <ListItem 
                        button key={index + "G"}
                        onClick={() => {
                            setSelectedFolder(index)
                            setFolderDrawer(false);
                            }}
                        >
                        <ListItemIcon>
                        {selectedFolder === index ?
                            <FolderOpenIcon style={{color: "#ff751a", fontWeight:"bold"}}/>
                            :
                            <FolderIcon style={{color: "#ff751a"}}/>
                        }
                        </ListItemIcon>
                        <ListItemText primary={row.title} />
                    </ListItem>
                ))}
            </List>
            <Divider />
        </div>
    );
    };

export default function QAContainer () {
    const classes = useStyles();
    const theme = useTheme();
    const [tabIndex, setTabIndex] = useState(1);
    const [selectedFolder, setSelectedFolder] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderDrawer, setFolderDrawer] = useState(false); 
    const [parent, setParent] = useState("file");
    const [data, setData] = useState(dataFromDB);
    const transitionDuration = {
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
      };
    useEffect(() => {
        setFolderName(data[selectedFolder].title);
    },[])

    useEffect(() => {
        setFolderName(data[selectedFolder].title);
    },[selectedFolder])

    return (
        <Fragment>
            <FileUploadDialog 
                open={openDialog} 
                setOpen={setOpenDialog}
                folderName={folderName}
                parent={parent}
            />
            <div className={classes.pageContentMargin}>
                <PageTitle title={`Knowledge | Papers`}/>
            </div>

            <div className={classes.pageContentMargin} style={{height:"70vh"}}>
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
                            {`Total record(s): ${data[selectedFolder]["files"].length}`}
                        </Typography>
                        {data[selectedFolder]["files"].map((row, index) => (
                            <div>
                                <ListItem button key={index + "F"}>
                                    
                                    <ListItemIcon>
                                    <Typography>{`${index + 1}.  `}</Typography>
                                    {/* <FileCopyIcon /> */}
                                    </ListItemIcon>
                                    <ListItemText primary={row.fileName} />
                                </ListItem>
                                <Divider/>
                            </div>
                        ))}
                    </List>
                    </Grid>
                </Grid>
                <Tooltip title="Upload" placement="top">
                    <Zoom
                        in
                        timeout={transitionDuration}
                        unmountOnExit
                        className={classes.fab} 
                    >
                        <Fab 
                            onClick={() => {
                                setOpenDialog(true); 
                                setParent("File");
                            }} 
                            color="secondary">
                            <PublishIcon/>
                        </Fab>
                    </Zoom>
                </Tooltip>
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
        </Fragment>
    ); }