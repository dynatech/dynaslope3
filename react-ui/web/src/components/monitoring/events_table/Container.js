import React, { useState, useEffect, useContext, Fragment } from "react";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import {
    CircularProgress, Typography, Paper,
    makeStyles
} from "@material-ui/core";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { Route, Switch, Link } from "react-router-dom";

import MonitoringEventTimeline from "./EventTimeline";
import CustomSearchRender from "./CustomSearchRender";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";
import { getMonitoringEvents } from "../ajax";

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

function MonitoringEventsTable (props) {
    const {
        width, location,
        match: { url }
    } = props;

    const classes = useStyles();

    const [data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count, setCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [sites_dict, setSitesDict] = useState({});

    // SEARCH AND FILTERS
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);

    const { sites } = useContext(GeneralContext);

    useEffect(() => {
        const temp = {};
        sites.forEach(site => {
            const address = prepareSiteAddress(site, true, "start");
            const site_code = site.site_code.toUpperCase();
            filter_sites_option.push(site_code);
            temp[site_code] = { site_id: site.site_id, address };
        });
        setSitesDict(temp);
    }, [sites]);

    useEffect(() => {
        // setTotalEventCount(setCount);
        setIsLoading(true);

        const offset = page * rowsPerPage;
        const limit = (page * rowsPerPage) + rowsPerPage;

        const input = {
            include_count: true,
            limit, offset, filters, search_str
        };
        
        getMonitoringEvents(input, ret2 => {            
            const { events, count: total } = ret2;
            const final_data = prepareEventsArray(events, sites_dict);
            setData(final_data);
            setCount(total);
            setIsLoading(false);
        });
    }, [
        page, rowsPerPage, filters,
        search_str, url, sites_dict
    ]);

    const options = {
        textLabels: {
            body: {
                noMatch: "No data",
            }
        },
        filterType: "multiselect",
        responsive: isWidthUp(width, "xs") ? "standard" : "simple",
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
            let is_empty = true;
            ret_filters.forEach((row, index) => {

                let filter_var = null;

                if (row.length !== 0) {
                    is_empty = false;
                    const { name: column_name } = columns[index];
                    if (column_name === "site_name") {
                        const site_ids = [];
                        const site_names = [];

                        row.forEach(site => {
                            site_ids.push(sites_dict[site].site_id);
                            site_names.push(site);
                        });

                        chosen_filters.push({
                            name: "site_ids",
                            data: site_ids
                        });

                        filter_var = site_names;
                    } else if (column_name === "entry_type") {
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
                customBodyRender: (value, { rowIndex }) => {
                    if (value === "Loading Data...") return value;
                    return prepareEventTimelineLink(url, value);
                }
            }
        },
        {
            name: "site_name",
            label: "Site",
            options: {
                filter: true,
                filterList: typeof filter_list.site_name === "undefined" ? [] : filter_list.site_name, 
                filterOptions: {
                    names: filter_sites_option
                }
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
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Events" />
            </div>
            <div className={classes.pageContentMargin}>
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
                                        data={data}
                                        columns={columns}
                                        options={options}
                                    />
                                </MuiThemeProvider>                    
                            </Paper>
                        )
                    }/>

                    <Route path={`${url}/:event_id`} render={
                        props => (
                            <MonitoringEventTimeline
                                {...props}
                                width={width}
                            />
                        )
                    }/>
                </Switch>
            </div>
        </Fragment>
    );
}

export default withWidth()(MonitoringEventsTable);
