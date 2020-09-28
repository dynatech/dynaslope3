import React from "react";
import QATable from "./Table";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    root: {
      width: "100%",
    },
  }));
export default function Lowering(){
    const classes= useStyles();
    return (
        <div className={classes.root}>
             <QATable tableTitle="QA for Event Lowering" />
        </div>
    );
}