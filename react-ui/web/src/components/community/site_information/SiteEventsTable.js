import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { CircularProgress, Typography, Paper, Button } from "@material-ui/core";
import { withStyles, createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { compose } from "recompose";
import { Route, Switch, Redirect } from "react-router-dom";

import CustomSearchRender from "./CustomSearchRender";
import EventTimeline from "../../monitoring/events_table/EventTimeline";
import GeneralStyles from "../../../GeneralStyles";
import { getMonitoringEvents } from "../../monitoring/ajax";

const styles = theme => ({
    eventTable: {
        minWidth: "900px"
    }
});

function prepareEventTimelineLink (url, event_id, setRedirect) {
    return (
        <Button
            onClick={ret => setRedirect(`/monitoring/events/${event_id}`)}
        >
            {event_id}
        </Button>
    );
}

function prepareEventsArray (url, arr, setRedirect) {
    return arr.map(
        (element, index) => {
            const {
                event_id, entry_type, 
                event_start, validity, public_alert
            } = element;

            let final_event_start = null;
            let final_ts_end = "ROUTINE";
            
            if (event_start !== "" && event_start !== null) final_event_start = moment(event_start).format("D MMMM YYYY, h:mm");
            if (validity !== "" && validity !== null) final_ts_end = moment(validity).format("D MMMM YYYY, h:mm");

            const event_link = prepareEventTimelineLink(url, event_id, setRedirect);
            const event_entry = [
                event_link,
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

function SiteEventsTable (props) {
    const {
        classes, width, location,
        match: { url },
        siteId
    } = props;


    const [table_data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count, setCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // SEARCH AND FILTERS
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);

    const [redirect, setRedirect] = useState(0);

    useEffect(() => {
        setIsLoading(true);

        const offset = page * rowsPerPage;
        const limit = (page * rowsPerPage) + rowsPerPage;

        const input = {
            include_count: true,
            limit, offset, filters: [...filters, { name: "site_ids", data: [siteId] }], search_str
        };

        getMonitoringEvents(input, ret => {
            const { events, count: total } = ret;
            const final_data = prepareEventsArray(url, events, setRedirect);
            setData(final_data);
            setCount(total);
            setIsLoading(false);
        });

    }, [page, rowsPerPage, filters, search_str]);

    const options = {
        textLabels: {
            body: {
                noMatch: "No data",
            }
        },
        filterType: "multiselect",
        responsive: isWidthUp(width, "xs") ? "standard" : "vertical",
        searchText: search_str,
        searchPlaceholder: "Type words to search narrative column",
        rowsPerPageOptions: [5, 10, 15],
        rowsPerPage,
        count,
        page,
        filter: true,
        selectableRows: "none",
        print: false,
        download: false,
        // filterType: "dropdown",
        serverSide: true,
        onTableChange: (action, tableState) => {
            // console.log(action, tableState);
            // a developer could react to change on an action basis or
            // examine the state as a whole and do whatever they want
            if (action === "changePage") {
                const { page: cur_page } = tableState;
                setPage(cur_page);
            } else if (action === "changeRowsPerPage") {
                const { rowsPerPage: cur_rpp } = tableState;
                if (cur_rpp !== rowsPerPage) setRowsPerPage(cur_rpp);
            } else if (action === "resetFilters") {
                setFilterList({});
                setFilters([]);
            } else if (action === "onSearchOpen") {
                setOnSearchOpen(true);
            }
        },
        onSearchChange: (search_string) => {
            // Looking for proper async implementation
            console.log(`Searching for ${search_string}`);
        },
        onFilterChange: (changedColumn, ret_filters) => {
            const chosen_filters = [];
            console.log("ret_filters", ret_filters);
            let is_empty = true;
            ret_filters.forEach((row, index) => {

                let filter_var = null;

                if (row.length !== 0) {
                    is_empty = false;
                    const { name: column_name } = columns[index];
                    if (column_name === "entry_type") {
                        const entry_types = [];
                        const entry_type_ids = [];
                        let temp;

                        row.forEach(type => {
                            if (type === "EVENT") { 
                                temp = 2;
                            } else if (type === "ROUTINE") {
                                temp = 1;
                            }
                            entry_types.push(type);
                            entry_type_ids.push(temp);
                        });

                        chosen_filters.push({
                            name: "entry_types",
                            data: entry_type_ids
                        });

                        filter_var = entry_types;
                    }
                    setFilterList({ ...filter_list, [column_name]: filter_var });
                }
            });

            if (is_empty) setFilterList({});
            setFilters(chosen_filters);
        },
        customSearchRender: (searchText, handleSearch, hideSearch, rendererOptions) => {
            let searchStr = searchText || "";

            if (on_search_open) {
                searchStr = search_str;
                setOnSearchOpen(false);
            }

            const custom_on_hide_fn = () => {
                hideSearch();
                setOnSearchOpen(false);
            };

            return (
                <CustomSearchRender
                    searchText={searchText}
                    onSearch={handleSearch}
                    onHide={custom_on_hide_fn}
                    options={rendererOptions}
                    onSearchClick={() => setSearchString(searchStr)}
                />
            );
        }
    };

    const columns = [
        {
            name: "event_id",
            label: "Event ID",
            options: {
                filter: false,
            }
        },
        {
            name: "entry_type",
            label: "Entry Type",
            options: {
                filter: true,
                filterList: typeof filter_list.entry_type === "undefined" ? [] : filter_list.entry_type, 
                filterOptions: {
                    names: ["ROUTINE", "EVENT"]
                },
                sort: false
            }
        },
        {
            name: "public_alert",
            label: "Last Alert Level",
            options: {
                filter: true,
                sort: true
            }
        },
        {
            name: "ts_start",
            label: "Event Start",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "ts_end",
            label: "Event End",
            options: {
                filter: false,
                sort: false
            }
        }
    ];

    return (
        <Fragment>
            {
                redirect === 0 ? (
                    <Switch location={location}>
                        <Route exact path={url} render={
                            props => (
                                <Paper className={classes.paperContainer}>
                                    <MuiThemeProvider theme={getMuiTheme}>
                                        <MUIDataTable
                                            title={
                                                <Typography variant="h5" component="div">
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
                                            data={table_data}
                                            columns={columns}
                                            options={options}
                                        />
                                    </MuiThemeProvider>                    
                                </Paper>
                            )
                        }/>

                        <Route path={`${url}/:event_id`} render={
                            props => (
                                <EventTimeline
                                    {...props}
                                    width={width}
                                />
                            )
                        }/>
                    </Switch>
                ) : (
                    <Redirect to={redirect} />
                )
            }

        </Fragment>
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
)(SiteEventsTable);
