import React, { 
    useState, useEffect,
    Fragment, useContext
} from "react";

import {
    Paper, LinearProgress, Checkbox, InputLabel,
    withStyles, Dialog, DialogContent, FormControl,
    Button, IconButton, ListItemText, Select, MenuItem,
    ListItemIcon
} from "@material-ui/core";
import { AddAlert, Edit, Delete, Error, Warning } from "@material-ui/icons";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MUIDataTable from "mui-datatables";
import { compose } from "recompose";

import CustomSearchRender from "./CustomSearchRender";
import { getNarratives } from "../ajax";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import NarrativeFormModal from "../../widgets/narrative_form/NarrativeFormModal";
import DeleteNarrativeModal from "../../widgets/narrative_form/DeleteNarrativeModal";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { GeneralContext } from "../../contexts/GeneralContext";
import { 
    subscribeToWebSocket, unsubscribeToWebSocket, receiveAlertsFromDB
} from "../../../websocket/monitoring_ws";

const styles = theme => ({
    inputGridContainer: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "0 0"
        }
    },
    buttonGrid: {
        textAlign: "right",
        [theme.breakpoints.down("sm")]: {
            textAlign: "right"
        }
    },
    button: {
        fontSize: 16,
        paddingLeft: 8
    }
});

const getMuiTheme = createMuiTheme({
    overrides: {
        MUIDataTableHeadCell: {
            root: {
                zIndex: "0 !important"
            }
        }
    }
});

function getManipulationButtons (narrative, data_handlers) {
    const { 
        setChosenNarrative, setIsOpenNarrativeModal,
        setIsOpenDeleteModal } = data_handlers;

    const handleEdit = value => {
        setChosenNarrative(narrative);
        setIsOpenNarrativeModal(true);
        console.log("Edit", narrative);
    };

    const handleDelete = value => {
        setChosenNarrative(narrative);
        setIsOpenDeleteModal(true);
    };

    return (
        <span>
            <IconButton tooltip="Edit" style={{ "float": "left" }} onClick={handleEdit}>
                <Edit style={{ fontSize: 20 }}/>
            </IconButton> 
            <IconButton tooltip="Delete" style={{ "float": "left" }} onClick={handleDelete}>
                <Delete style={{ fontSize: 20 }}/>
            </IconButton>
        </span>        
    );
}


function processTableData (data) {
    const processed = data.map(row => {
        const {
            narrative, user_details, site_id,
            user_id, id, type_id, event_id,
            timestamp
        } = row;
        const { last_name, first_name } = user_details;
        return ({
            narrative,
            user_details: `${first_name} ${last_name}`,
            site_name: prepareSiteAddress(row.site, true, "start"),
            timestamp,
            type: row.type_id,
            actions: "---",
            site_id,
            user_id,
            id,
            type_id,
            event_id
        });
    });

    return processed;
}
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};


function SiteLogs (props) {
    const { classes, width } = props;
    const [table_data, setTableData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);
    const [is_loading, setIsLoading] = useState(true);
    const [isOpenNarrativeModal, setIsOpenNarrativeModal] = useState(false);
    const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

    const [chosenNarrative, setChosenNarrative] = useState({});
    const [isUpdateNeeded, setIsUpdateNeeded] = useState(false);
    const [alertsFromDbData, setAlertsFromDbData] = useState(null);
    const { setIsReconnecting } = useContext(GeneralContext);

    const { sites } = useContext(GeneralContext);

    const [activeSites, setActiveSites] = useState([]);
    const filter_sites_option = [];
    const sites_dict = {};

    sites.forEach(site => {
        const site_code = site.site_code.toUpperCase();
        filter_sites_option.push(site_code);
        sites_dict[site_code] = site.site_id;
    });

    useEffect(() => {
        subscribeToWebSocket(setIsReconnecting);
        receiveAlertsFromDB(alerts_from_db => setAlertsFromDbData(alerts_from_db));
        return function cleanup () {
            unsubscribeToWebSocket();
        };
    }, []);

    useEffect( () => {
        if (alertsFromDbData !== null) {
            const { latest, routine, extended, overdue } = alertsFromDbData;
            const latest_event = latest.map(val => { return val.event.site.site_code; });
            const overdue_event = overdue.map(val => { return val.event.site.site_code; });
            const extended_event = extended.map(val => { return val.event.site.site_code; });
            const active = [{ latest: latest_event, overdue: overdue_event, extended: extended_event, routine }]; 
            setActiveSites(active);
        }
    }, [alertsFromDbData]);

    useEffect(() => {
        setIsLoading(true);
        const input = {
            include_count: true,
            limit: rowsPerPage, offset: page * rowsPerPage,
            filters,
            search_str
        };

        getNarratives(input, ret => {
            const { narratives, count: total } = ret;
            const processed = processTableData(narratives);
            setTableData(processed);
            setCount(total);
            setIsLoading(false);
        });
    }, [page, rowsPerPage, filters, search_str, isUpdateNeeded]);

    const handleBoolean = (data, bool) => () => {
        // NOTE: there was no need to use the bool for opening a modal or switch
        if (data === "is_narrative_modal_open") {
            setIsOpenNarrativeModal(!isOpenNarrativeModal);
        } else if (data === "is_open_delete_modal") {
            setIsOpenDeleteModal(!isOpenDeleteModal);
        }
    };
    const options = {
        textLabels: {
            body: {
                noMatch: "No data",
            }
        },
        selectableRows: "none",
        print: false,
        download: false,
        filterType: "multiselect",
        responsive: isWidthUp(width, "xs") ? "scroll" : "scrollFullHeight",
        serverSide: true,
        searchText: search_str,
        searchPlaceholder: "Type words to search narrative column",
        rowsPerPageOptions: [5, 10, 15],
        rowsPerPage,
        count,
        page,
        onTableChange (action, table_state) {
            if (action === "changePage") {
                const { page: cur_page } = table_state;
                setPage(cur_page);
            } else if (action === "changeRowsPerPage") {
                const { rowsPerPage: cur_rpp } = table_state;

                if (cur_rpp !== rowsPerPage) setRowsPerPage(cur_rpp);
            } else if (action === "resetFilters") {
                setFilterList({});
                setFilters([]);
            } else if (action === "onSearchOpen") {
                setOnSearchOpen(true);
            }
        },
        onFilterChange (column, ret_filters) {
            const chosen_filters = [];
            let is_empty = true;
            ret_filters.forEach((row, index) => {
                if (row.length !== 0) {
                    is_empty = false;
                    const { name: column_name } = columns[index];
                    if (column_name === "site_name") {
                        const site_ids = [];
                        const site_names = [];

                        row.forEach(site => {
                            site_ids.push(sites_dict[site]);
                            site_names.push(site);
                        });

                        chosen_filters.push({
                            name: "site_ids",
                            data: site_ids
                        });

                        setFilterList({ ...filter_list, [column_name]: site_names });
                    }
                }
            });

            if (is_empty) setFilterList({});
            setFilters(chosen_filters);
        },
        customSearchRender: (searchText, handleSearch, hideSearch, options) => {
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
                    options={options}
                    onSearchClick={() => setSearchString(searchStr)}
                />
            );
        }
    };

    const columns = [
        {
            name: "timestamp",
            label: "Timestamp",
            options: {
                filter: false,
                sort: false,
                customBodyRender: value => {
                    return moment(value).format("DD MMMM YYYY, HH:mm:ss");
                }
            }
        },
        {
            name: "site_name",
            label: "Site",
            options: {
                display: "true",
                filter: true,
                filterType: "custom",
                filterList: typeof filter_list.site_name === "undefined" ? [] : filter_list.site_name,
                filterOptions: {
                    logic: (location, filterss) => {
                        if (filterss.length) return !filterss.includes(location);
                        return false;
                    },
                    // eslint-disable-next-line max-params
                    display: (filterList, onChange, index, column) => {
                        return (
                            <FormControl>
                                <InputLabel>Site</InputLabel>
                                <Select
                                    multiple
                                    MenuProps= {MenuProps}
                                    value={filterList[index]}
                                    renderValue={selected => selected.join(", ")}
                                    onChange={event => {
                                        // eslint-disable-next-line no-param-reassign
                                        filterList[index] = event.target.value;
                                        onChange(filterList[index], index, column);
                                    }}
                                >
                                    {filter_sites_option.map(site => {
                                        let color = "";
                                        let icon = "";    
                                        let type = "";       
                                        const { latest, extended, routine, overdue } = activeSites[0];
                                        let latest_db_alerts = [];
                                        let extended_db_alerts = [];
                                        let overdue_db_alerts = [];
                                        let routine_db_alerts = [];
                                        latest_db_alerts = latest;
                                        extended_db_alerts = extended;
                                        overdue_db_alerts = overdue;
                                        routine_db_alerts = routine;
                                        if (latest_db_alerts.includes(site.toLowerCase())) {
                                            color = "red";
                                            type = "event";
                                            icon = <Warning style={{ color: "red" }}/>;
                                        }
                                        if (extended_db_alerts.includes(site.toLowerCase())) {
                                            color = "";
                                            type = "extended";
                                            icon = <Warning style={{ color: "yellow" }}/>;
                                        }
                                        if (typeof routine_db_alerts.released_sites !== "undefined" && routine_db_alerts.length > 0) {
                                            if (routine_db_alerts.includes(site.toLowerCase())) {
                                                color = "red";
                                                type = "routine";
                                                icon = <Warning style={{ color: "red" }}/>;
                                            } }
                                        if (overdue_db_alerts.includes(site.toLowerCase())) {
                                            color = "red";
                                            type = "overdue";
                                            icon = <Warning style={{ color: "red" }}/>;
                                        }

                                        
                                        return (
                                            <MenuItem key={site} value={site}>
                                                <Checkbox
                                                    color="primary"
                                                    checked={filterList[index].indexOf(site) > -1}
                                                />
                                                <ListItemText primary={site} secondary={type} style = {{ color }} />
                                                <ListItemIcon>{icon}</ListItemIcon>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        );
                    },
                },
                sort: false
            }
        },
        {
            name: "narrative",
            label: "Narrative",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "type",
            label: "Type",
            options: {
                filter: true,
            }
        },
        {
            name: "user_details",
            label: "Reporter",
            options: {
                filter: false
            }
        },
        {
            name: "actions",
            label: "Actions",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, { rowIndex }) => {
                    const row = table_data[rowIndex];
                    return getManipulationButtons(row, { 
                        setChosenNarrative, 
                        setIsOpenNarrativeModal, isOpenNarrativeModal,
                        setIsOpenDeleteModal, isOpenDeleteModal
                    });
                }
            }
        }
    ];

    const is_desktop = isWidthUp("md", width);

    const custom_buttons = <span>
        <Button
            aria-label="Write a site log"
            variant="contained"
            color="primary"
            size="small"
            style={{ marginRight: 8 }}
            onClick={handleBoolean("is_narrative_modal_open", true)}
        >
            <AddAlert style={{ paddingRight: 4, fontSize: 20 }} />
            Write a Site Log
        </Button>
    </span>;

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle 
                    title="Alert Monitoring | Site Logs" 
                    customButtons={is_desktop ? custom_buttons : false}
                />
            </div>

            {
                <Dialog open={is_loading} fullWidth>
                    <DialogContent>
                        <div style={{ flexGrow: 1 }}>
                            <LinearProgress variant="query" color="secondary" />
                        </div>
                    </DialogContent>
                </Dialog>
            }

            <div className={classes.pageContentMargin}>
                <Paper className={classes.paperContainer}>
                    <MuiThemeProvider theme={getMuiTheme}>
                        <MUIDataTable
                            title="Site Logs"
                            data={table_data}
                            columns={columns}
                            options={options}
                        />
                    </MuiThemeProvider>
                </Paper>
            </div>

            <NarrativeFormModal
                isOpen={isOpenNarrativeModal}
                closeHandler={handleBoolean("is_narrative_modal_open", false)}
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
                chosenNarrative={chosenNarrative}
                isFromSiteLogs = {activeSites}
            />

            <DeleteNarrativeModal
                isOpen={isOpenDeleteModal}
                closeHandler={handleBoolean("is_open_delete_modal", false)}
                chosenNarrative={chosenNarrative}
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
            />
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
)(SiteLogs);
