import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import axios from "axios";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import {     
    Grid, Paper, Typography,
    Divider, Button, ButtonGroup,
    Card, CardActions, CardContent,

    GridList, GridListTile, GridListTileBar, 
    ListSubheader, IconButton,
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";

import { withStyles, makeStyles } from "@material-ui/core/styles";
import { compose } from "recompose";

import { blue } from "@material-ui/core/colors";
import PageTitle from "../reusables/PageTitle";

import GeneralStyles from "../../GeneralStyles";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: 500,
        height: 450,
    },
    icon: {
        color: "rgba(255, 255, 255, 0.54)",
    },
}));

const styles = theme => ({
    card: {
        minWidth: 275,
    },
    bullet: {
        display: "inline-block",
        margin: "0 2px",
        transform: "scale(0.8)",
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },    
});

const tileData = [
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    },
    {
        title: "Hello world",
        author: "Juana Dela Cross" 
    }
];

function TestComponent (props) {
    const {
        classes,
    } = props;
    const new_classes = {
        ...classes,
        ...styles(),
        ...useStyles(),
    };
    const bull = <span className={new_classes.bullet}>•</span>;

    return (
        <div className={new_classes.pageContentMargin}>
            <PageTitle title="Alert Monitoring | Events" />
            <Grid container spacing={2}>
                <Grid item sm={8}>
                    <Paper className={new_classes.root}>
                        <Typography variant="h5" component="h3">
                            This is a sheet of paper.
                        </Typography>
                        <Typography component="p">
                            Paper can be used to build surface or other elements for your application.
                        </Typography>
                    </Paper>                
                </Grid>
                <Grid item sm={4}>
                    <Grid container>
                        <PageTitle title="Issues and Reminders" />
                        <Grid item sm={12}>
                            <div className={new_classes.root}>
                                <GridList cellHeight={180} className={new_classes.gridList}>
                                    <GridListTile key="Subheader" cols={2} style={{ height: "auto" }}>
                                        <ListSubheader component="div">December</ListSubheader>
                                    </GridListTile>
                                    {tileData.map(tile => (
                                        <GridListTile key={tile.img}>
                                            {/* <img src={tile.img} alt={tile.title} /> */}
                                            <GridListTileBar
                                                title={tile.title}
                                                subtitle={<span>by: {tile.author}</span>}
                                                actionIcon={
                                                    <IconButton aria-label={`info about ${tile.title}`} className={new_classes.icon}>
                                                        <InfoIcon />
                                                    </IconButton>
                                                }
                                            />
                                        </GridListTile>
                                    ))}
                                </GridList>
                            </div>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* <Grid container spacing={2}>
                <Grid item sm={12}>
               
                </Grid>
            </Grid> */}
        </div>        

    );
}

export default compose(
    withStyles(
        (theme) => ({
            ...GeneralStyles(theme),
            ...styles(theme),
        }),
        { withTheme: true },
    ), withWidth()
)(TestComponent);
