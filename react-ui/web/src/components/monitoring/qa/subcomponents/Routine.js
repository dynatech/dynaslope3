import React from "react";
import { Typography } from "@material-ui/core";
import QATable from "./Table";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    root: {
      width: "100%",
    },
  }));

export default function Routine(){
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <QATable tableTitle="QA for Routine Monitoring" />
        </div>
    );
}