import React, { useState, useEffect, Fragment } from "react";

import {
    Grid, Button, FormHelperText,
    CircularProgress, Select, MenuItem,
    FormControl, Paper, Typography, List, ListItem,
    ListItemIcon, ListItemText, Divider
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../../components/reusables/PageTitle";

//icons
import FileCopyIcon from '@material-ui/icons/FileCopy';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import FolderIcon from '@material-ui/icons/Folder';
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

  const data = [
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
            title:"Q1 | 2020",
            files: [
                {
                    fileName: "MIA updates",
                    link: "",
                }
            ]
        },
        {
            title:"Q2 | 2020",
            files: [
                {
                    fileName: "lhilhk",
                    link: "",
                }
            ]
        },
        {
            title:"Q3 | 2020",
            files: [
                {
                    fileName: "ddfdf",
                    link: "",
                }
            ]
        },
    ];
export default function QAContainer () {
    const classes = useStyles();
    const [tabIndex, setTabIndex] = useState(1);
    const [selectedFolder, setSelectedFolder] = useState(0);
    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title={`Knowledge Management | Protocols`}/>
            </div>

            <div className={classes.pageContentMargin}>
                <Grid container spacing={2}>
                    <Grid item md={3}>
                        <List component="nav" aria-label="main mailbox folders">
                        
                            {data.map((row, index) => (
                                <ListItem button onClick={() => setSelectedFolder(index)} >
                                    <ListItemIcon>
                                    {selectedFolder === index ?
                                        <FolderOpenIcon style={{color: "#ff751a", fontWeight:"bold"}}/>
                                        :
                                        <FolderIcon style={{color: "#ff751a"}}/>
                                    }
                                    </ListItemIcon>
                                    <ListItemText primary={row.title} />
                                </ListItem>
                            )
                            )}
                        </List>
                        <Divider />
                        <List component="nav" aria-label="secondary mailbox folders">
                            <ListItem button>
                            <ListItemText primary="Add new folder" />
                            </ListItem>
                    </List>
                    </Grid>
                    <Grid item md={9}>
                    <List component="nav" aria-label="main mailbox folders">
                        <Typography color="textSecondary">
                            {`Total files: ${data[selectedFolder]["files"].length}`}
                        </Typography>
                        {data[selectedFolder]["files"].map((row, index) => (
                            <div>
                                <ListItem button>
                                    
                                    <ListItemIcon>
                                    <Typography>{`${index + 1}.  `}</Typography>
                                    {/* <FileCopyIcon /> */}
                                    </ListItemIcon>
                                    <ListItemText primary={row.fileName} />
                                </ListItem>
                                <Divider/>
                            </div>
                        )
                        )}
                    </List>
                    </Grid>
                </Grid>
            </div>
        </Fragment>
    ); }