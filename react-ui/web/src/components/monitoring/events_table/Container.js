import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { CircularProgress, Typography, Paper } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";

const styles = theme => ({
    eventTable: {
        minWidth: "900px"
    }
});

function setTotalEventCount (setCount) {
    let data_length;
    axios.get("http://127.0.0.1:5000/api/monitoring/get_monitoring_events?filter_type=count")
    .then(response => {
        setCount(response.data);
    })
    .catch(error => {
        console.log(error);
    });
}


function prepareEventsArray (arr) {
    return arr.map(
        ({
            event_id, site_code, purok,
            sitio, barangay, municipality,
            province, entry_type, ts_start,
            ts_end
        }) => {
            let final_ts_end = "ON-GOING";
            if (ts_end !== "" && ts_end !== null) final_ts_end = moment(ts_end).format("D MMMM YYYY, h:mm");
            const event_entry = [
                event_id,
                prepareSiteAddress(site_code, purok, sitio, barangay, municipality, province),
                entry_type,
                moment(ts_start).format("D MMMM YYYY, h:mm"),
                final_ts_end
            ];
            return event_entry;
        });
}

function prepareSiteAddress (site_code, purok, sitio, barangay, municipality, province) {
    try {
        let temp = `${site_code.toUpperCase()} (`;
        if (purok !== null) temp += `${sitio}, `;
        if (sitio !== null) temp += `${sitio}, `;

        const site_address = `${temp}${barangay}, ${municipality}, ${province})`;
        return site_address;
    }
    catch (err) {
        console.error(err);
    }
}

function MonitoringEventsTable (props) {
    const { classes } = props;
    const columns = ["Event ID", "Site", "Entry Type", "TS Start", "TS End"];
    const [data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [count, setCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTotalEventCount(setCount);
        setIsLoading(true);

        const offset = page * rowsPerPage;
        const limit = page * rowsPerPage + rowsPerPage;

        let final_data;
        axios.get(`http://127.0.0.1:5000/api/monitoring/get_monitoring_events?filter_type=complete&offset=${offset}&limit=${limit}`)
        .then(response => {
            setIsLoading(false);
            final_data = prepareEventsArray(response.data);
            setData(final_data);
        })
        .catch(error => {
            console.log(error);
        });

    }, [page, rowsPerPage]);

    const changePage = (active_page) => {
        setPage(active_page);
    };

    const changeRowsPerPage = (rows) => {
        setRowsPerPage(rows);
    };

    const options = {
        filter: true,
        selectableRows: "none",
        print: false,
        download: false,
        filterType: "dropdown",
        responsive: "scroll",
        serverSide: true,
        count,
        page,
        rowsPerPageOptions: [5, 10, 15, 25, 50],
        rowsPerPage,
        onTableChange: (action, tableState) => {
            console.log(action, tableState);
            // a developer could react to change on an action basis or
            // examine the state as a whole and do whatever they want

            switch (action) {
                case "changePage":
                    changePage(tableState.page);
                    break;
                case "changeRowsPerPage":
                    changeRowsPerPage(tableState.rowsPerPage);
                    break;
                default:
                    break;
            }
        },
        onSearchChange: (search_string) => {
            // Looking for proper async implementation
            console.log(`Searching for ${search_string}`);
        },
        onFilterChange: (changedColumn, filterList) => {
            // Parking for now. Prioritizing other tasks
            console.log("changedColumn", changedColumn);
            console.log("filterList", filterList);
        }
    };

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Events" />
            </div>

            <div className={`${classes.pageContentMargin}`}>
                <Paper className={classes.paperContainer}>
                    <MUIDataTable
                        title={
                            <Typography>
                                Monitoring Events Table
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
                        }
                        data={data}
                        columns={columns}
                        options={options}
                    />
                </Paper>
            </div>
        </Fragment>
    );
}

export default withStyles(
    (theme) => ({
        ...GeneralStyles(theme),
        ...styles(theme),
    }),
    { withTheme: true },
)(MonitoringEventsTable);
