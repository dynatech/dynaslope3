import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { CircularProgress, Typography, Paper } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { compose } from "recompose";

import CustomSearchRender from "./CustomSearchRender";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { sites } from "../../../store";
import { getMonitoringEvents } from "../ajax";

const filter_sites_option = [];
const sites_dict = {};


sites.forEach(site => {
    const address = prepareSiteAddress(site, true, "start");
    const site_code = site.site_code.toUpperCase();
    filter_sites_option.push(site_code);
    sites_dict[site_code] = { site_id: site.site_id, address };
});

const styles = theme => ({
    eventTable: {
        minWidth: "900px"
    }
});

function setTotalEventCount (setCount) {
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
            province, entry_type, 
            event_start, validity,
            ts_start, ts_end
        }) => {
            // let final_ts_end = "ON-GOING";
            // if (ts_end !== "" && ts_end !== null) final_ts_end = moment(ts_end).format("D MMMM YYYY, h:mm");
            let final_ts_end = "ROUTINE";
            if (validity !== "" && validity !== null) final_ts_end = moment(validity).format("D MMMM YYYY, h:mm");            
            const event_entry = [
                event_id,
                sites_dict[site_code.toUpperCase()].address,
                entry_type,
                event_start,
                final_ts_end
                // moment(ts_start).format("D MMMM YYYY, h:mm"),
                // final_ts_end
            ];
            return event_entry;
        });
}

function MonitoringEventsTable (props) {
    const { classes, width } = props;
    const [data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [count, setCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // SEARCH AND FILTERS
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);

    useEffect(() => {
        // setTotalEventCount(setCount);
        setIsLoading(true);

        const offset = page * rowsPerPage;
        const limit = page * rowsPerPage + rowsPerPage;
        // const limit = rowsPerPage;

        const input = {
            include_count: true,
            limit, offset, filters, search_str
        };
        console.log(input);

        getMonitoringEvents(input, ret => {
            const { events, count: total } = ret;
            console.log("ret", ret);
            const final_data = prepareEventsArray(events);
            console.log("final_data", final_data);
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
        responsive: isWidthUp(width, "xs") ? "scroll" : "scrollFullHeight",
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

            // switch (action) {
            //     case "changePage":
            //         changePage(tableState.page);
            //         break;
            //     case "changeRowsPerPage":
            //         changeRowsPerPage(tableState.rowsPerPage);
            //         break;
            //     default:
            //         break;
            // }
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
                    if (column_name === "site_name") {
                        const site_ids = [];
                        const site_names = [];

                        row.forEach(site => {
                            console.log("site", site);
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

export default compose(
    withStyles(
        (theme) => ({
            ...GeneralStyles(theme),
            ...styles(theme),
        }),
        { withTheme: true },
    ), withWidth()
)(MonitoringEventsTable);
