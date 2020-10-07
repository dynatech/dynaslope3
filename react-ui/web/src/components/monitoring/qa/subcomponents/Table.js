import React, { useState, useEffect, useContext, Fragment } from "react";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import {
    CircularProgress, Typography, Paper, Grid,
    makeStyles
} from "@material-ui/core";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { Route, Switch, Link, useHistory, useLocation} from "react-router-dom";

import CustomSearchRender from "../../events_table/CustomSearchRender";
import PageTitle from "../../../reusables/PageTitle";
import GeneralStyles from "../../../../GeneralStyles";
import { prepareSiteAddress } from "../../../../UtilityFunctions";
import { GeneralContext } from "../../../contexts/GeneralContext";
import { getMonitoringEvents } from "../../ajax";
import { getEventTimelineEntries } from "../../ajax";
import { filter, forEach } from "lodash";
import _ from "lodash";
const filter_sites_option = [];

const useStyles = makeStyles(theme => ({
    ...GeneralStyles(theme),
    eventTable: {
        minWidth: "900px"
    }

}));

function prepareEventTimelineLink (url, event_id) {
    return (
        <Link
            to={`${url}/${event_id}`}
        >
            {event_id}
        </Link>
    );
}

function prepareEventsArray (arr, sites_dict) {
    return arr.map(
        (element, index) => {
            const {
                event_id, site_code, entry_type, 
                event_start, validity, public_alert
            } = element;

            let final_event_start = null;
            let final_ts_end = "ROUTINE";
            
            if (event_start !== "" && event_start !== null) final_event_start = moment(event_start).format("D MMMM YYYY, HH:mm");
            if (validity !== "" && validity !== null) final_ts_end = moment(validity).format("D MMMM YYYY, HH:mm");

            let address = "";
            if (Object.keys(sites_dict).length) {
                const { address: add } = sites_dict[site_code.toUpperCase()];
                address = add;
            }

            const event_entry = [
                event_id,
                address,
                entry_type,
                public_alert,
                final_event_start,
                final_ts_end
            ];

            return event_entry;
        });
}

const getMuiTheme = createMuiTheme({
    overrides: {
        MUIDataTableHeadCell: {
            root: {
                zIndex: "0 !important"
            }
        }
    }
});


function MonitoringEventTimeline (props) {
    const { match: { params: { event_id } } } = props;
    const classes = useStyles();
    const [eventDetails, setEventDetails] = useState({
        event_id,
        site_code: "---",
        site_id: 1,
        validity: moment(),
        event_start: moment(),
        site_address: "",
        status: 1
    });
    const [timelineItems, setTimelineItems] = useState([]);
    const [chosenReleaseDetail, setChosenReleaseDetail] = useState({});
    const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);

    useEffect(() => {
        const input = { event_id };
        getEventTimelineEntries(input, ret => {
            const {
                event_details, timeline_items
            } = ret;
            if (Object.keys(event_details).length > 0) {
                setEventDetails(event_details);
                setTimelineItems(timeline_items);
            }
        });
    }, []);

    const monitoring_type = eventDetails.status === 1 ? "ROUTINE" : "EVENT";
    const bulletinHandler = release => event => {
        console.log(release);
        const rel = { ...release, type: null };
        setChosenReleaseDetail(rel);
        setIsOpenBulletinModal(true);
    };

    const format_str = "MMMM Do YYYY, hh:mm A";
    const start_ts = moment(eventDetails.event_start).format(format_str);

    let end_ts = "PRESENT";
    if (eventDetails.validity !== null) end_ts = moment(eventDetails.validity).format(format_str);

    return (
        <Grid container spacing={2}>
            {/* <Grid item xs={12} align="center">
                <Typography variant="h5">
                    {monitoring_type} Monitoring Timeline
                </Typography>
            </Grid> */}
            <Grid item xs={12}>
                <Typography variant="h6" align="center">
                    <strong>{monitoring_type} MONITORING TIMELINE</strong>
                </Typography>
                <Typography 
                    variant="h4"
                    align="center"
                >
                    {eventDetails.site_address} ({eventDetails.site_code.toUpperCase()})
                </Typography>
                <Typography 
                    variant="subtitle1"
                    align="center"
                >
                    { `${start_ts} to ${end_ts}` }
                </Typography>
            </Grid>
        </Grid>
    );
}
function QATable (props) {
    const location = useLocation();
    const url = window.location.href;
    const {
        width, tableTitle, isLoading, columns, type
    } = props;

    const classes = useStyles();
    const [data, setData] = useState(props.data);
    const [cols, setCols] = useState([]);

    const sites_count = _(data)
        .groupBy('site_name')
        .map(function(items, name) { 
            return name;
        }).value().length;

    useEffect(() => {
        columns.map((col, index) =>{
            switch(col.name){
                case "ewi_sms": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            let limit = moment(limit_start);
                            const sent_ts = moment(value);
                            sites_count > 5 ? limit.add(sites_count, "minutes") : limit.add(5 ,"minutes");
                            if(type === "Lowering") limit.add(15, "minutes");
                            const error = sent_ts > limit ? true : false;

                            return (
                                <span style={{color: error ? "red" : ""}} >{value}</span>
                            )
                        },
                    }  
                }
                break;

                case "ewi_bulletin_release" && type !=="Routine": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            let limit = moment(limit_start).add(10 ,"minutes");
                            const sent_ts = moment(value);
                            if(sites_count > 5) limit = limit_start.add((sites_count * 2), "minutes");
                            if(type === "Lowering") limit.add(15, "minutes");
                            const error = sent_ts > limit ? true : false;

                            return (
                                <span style={{color: error ? "red" : ""}} >{value}</span>
                            )
                        },
                    }  
                }
                break;
                case "rainfall_info": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            let limit = moment(limit_start).add(15 ,"minutes");
                            const sent_ts = moment(value);
                            //if(sites_count > 5) limit = limit_start.add((sites_count * 2), "minutes");
                            const error = sent_ts > limit ? true : false;

                            return (
                                <span style={{color: error ? "red" : ""}} >{value}</span>
                            )
                        },
                    }  
                }
                break;
                case "ground_measurement": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            let start_limit = moment(limit_start).subtract(2.5 ,"hours");
                            let end_limit = moment(limit_start).subtract(2 ,"hours");
                            const sent_ts = moment(value);
                            const error = sent_ts >= start_limit && sent_ts <= end_limit ? true : false;

                            return (
                                <span style={{color: error ? "red" : ""}} >{value}</span>
                            )
                        },
                    }  
                }
                break;
            }
            
        });

        setCols(columns);

    },[columns]);

    const options = {
        textLabels: {
            body: {
                noMatch: `No ${type} event(s)`,
            }
        },
        responsive: isWidthUp(width, "xs") ? "scroll" : "scrollFullHeight",
        filter: true,
        selectableRows: "none",
        print: true,
        download: true,
        downloadOptions: {
            filename: `${type}_releases_${props.shift_start_ts}.csv`,
            separator: ';',
        },
        filterType: "dropdown",
        onTableChange: (action, tableState) => {
           if (action === "resetFilters") {
                setData(props.data);
           }
            if(action === "propsUpdate"){
                setData(props.data);
            }
        },
    };

   

    return (
        <Fragment>
            <div>
                <MuiThemeProvider theme={getMuiTheme}>
                    <MUIDataTable
                        title={
                            <div>
                                <Typography variant="h5" component="div">
                                    {type} releases
                                    {
                                        isLoading &&
                                            <CircularProgress
                                                size={24}
                                                style={{
                                                    marginLeft: 15,
                                                    position: "relative",
                                                    top: 4
                                                }}
                                            />
                                    }
                                </Typography>
                                {/* <Typography variant="caption">Click site name to view all releases</Typography> */}
                            </div>
                            }
                        data={data}
                        columns={cols}
                        options={options}
                    />
                </MuiThemeProvider>                           
            </div>
        </Fragment>
    );
}

export default withWidth()(QATable);
