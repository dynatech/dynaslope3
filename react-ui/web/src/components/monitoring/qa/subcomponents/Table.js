import React, { useState, useEffect, useContext, Fragment } from "react";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import {
    CircularProgress, Typography, Paper,
    makeStyles
} from "@material-ui/core";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { Route, Switch, Link, useHistory, useLocation} from "react-router-dom";

import MonitoringEventTimeline from "../../events_table/EventTimeline";
import CustomSearchRender from "../../events_table/CustomSearchRender";
import PageTitle from "../../../reusables/PageTitle";
import GeneralStyles from "../../../../GeneralStyles";
import { prepareSiteAddress } from "../../../../UtilityFunctions";
import { GeneralContext } from "../../../contexts/GeneralContext";
import { getMonitoringEvents } from "../../ajax";

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



function QATable (props) {
    const location = useLocation();
    const url = window.location.href;
    const {
        width, tableTitle, isLoading
    } = props;

    const classes = useStyles();

    const [data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count, setCount] = useState(1);
    const [sites_dict, setSitesDict] = useState({});

    // SEARCH AND FILTERS
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);

    const { sites } = useContext(GeneralContext);

    const final_data = props.data.map(row => {
        return {site_name : row.toUpperCase()};
    });

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

        const offset = page * rowsPerPage;
        const limit = (page * rowsPerPage) + rowsPerPage;

        const input = {
            include_count: true,
            limit, offset, filters, search_str
        };
        
        // getMonitoringEvents(input, ret2 => {            
        //     const { events, count: total } = ret2;
        //     //const final_data = prepareEventsArray(events, sites_dict);
        //     //setData(final_data);
        //     setCount(total);
        //     setIsLoading(false);
        // });
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
            name: "ewi_web_release",
            label: "EWI Web Release",
            options: {
                filter: false,
                filterList: typeof filter_list.entry_type === "undefined" ? [] : filter_list.entry_type, 
                // filterOptions: {
                //     names: ["ROUTINE", "EVENT"]
                // },
                sort: false
            }
        },
        {
            name: "ewi_bulletin_release",
            label: "EWI Bulletin",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "rainfall_info",
            label: "Rainfall Info",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "ground_measurement",
            label: "Ground Measurement",
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
        {
            name: "fyi_permission",
            label: "FYI Permission",
            options: {
                filter: false,
                sort: false
            }
        }
    ];

    return (
        <Fragment>
            <div className={classes.pageContentMargin} style={{margin: 10}}>
                {/* <PageTitle title={tableTitle} /> */}
            </div>
            <div className={classes.pageContentMargin}>
                <MuiThemeProvider theme={getMuiTheme}>
                    <MUIDataTable
                        title={
                            <div>
                                <Typography variant="h5" component="div">
                                    Latest release
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
                                <Typography variant="caption">Click site name to view site history</Typography>
                            </div>
                            }
                        data={final_data}
                        columns={columns}
                        options={options}
                    />
                </MuiThemeProvider>                           
            </div>
        </Fragment>
    );
}

export default withWidth()(QATable);
