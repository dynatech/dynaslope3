import React from "react";
import {useState, useEffect} from "react"
import { Typography } from "@material-ui/core";
import QATable from "./Table";
import { makeStyles } from '@material-ui/core/styles';
import _ from "lodash";
const useStyles = makeStyles((theme) => ({
    root: {
      width: "100%",
    },
  }));

export default function Event(props){
    const classes= useStyles();
    const {eosData, isLoading } = props;
    const [event_ids, setEvents] = useState(null);
    const [sites, setSites] = useState(null);

    useEffect(() => {
      if(eosData.length > 0){
        const eve_ids = _.map(eosData, 'event_id' );
        const site_codes = _.map(eosData, 'site_code' );
        setEvents(eve_ids);
        setSites(site_codes);
        console.log(eve_ids, site_codes);
      }
    },[eosData])
    return (
        <div className={classes.root}>
            <QATable 
              isLoading={isLoading} 
              tableTitle="QA for Event Monitoring" 
              type="monitoring"
              data={sites}
            />
        </div>
    );
}