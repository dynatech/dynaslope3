import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import _ from "lodash";
import QATable from "./Table";


const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
    },
}));

export default function Event (props) {
    const classes = useStyles();
    const { releasesData, isLoading } = props;
    const columns = [
        {
            name: "site_name",
            label: "Site",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "ewi_web_release",
            label: "EWI Web Release",
            options: {
                filter: false,
                sort: false
            }

        },
        {
            name: "ewi_sms",
            label: "EWI SMS",
            options: {
                filter: false,
                sort: false
            }

        },
        {
            name: "ground_measurement",
            label: "Ground Meas Reminder",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "ground_data",
            label: "Ground Data",
            options: {
                filter: false,
                sort: false
            }
        },
    ];

    return (
        <div className={classes.root}>
            <QATable 
                isLoading={isLoading} 
                tableTitle="QA for Event Monitoring" 
                type="Extended"
                datas={releasesData}
                columns={columns}
            />
        </div>
    );
}