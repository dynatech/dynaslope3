import React, { 
    useState, useEffect,
    Fragment, useContext
} from "react";

import {
    Paper, LinearProgress, Checkbox, InputLabel,
    makeStyles, Dialog, DialogContent, FormControl,
    Button, IconButton, ListItemText, Select, MenuItem,
    ListItemIcon
} from "@material-ui/core";
import { AddAlert, Edit, Delete, Warning } from "@material-ui/icons";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MUIDataTable from "mui-datatables";

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

const useStyles = makeStyles(theme => {
    const gen = GeneralStyles(theme);
    return {
        ...gen,
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
        },
        alert3: {
            ...gen.alert3,
            "&:hover *": {
                color: "#222222 !important"
            },
        }
    }; 
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
        setIsOpenDeleteModal, setIsEditMode } = data_handlers;

    const handleEdit = value => {
        setChosenNarrative(narrative);
        setIsOpenNarrativeModal(true);
        setIsEditMode(true);
        // console.log("Edit", narrative);
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

        let name = "---";
        if (user_details !== null) {
            const { last_name, first_name } = user_details;
            name = `${first_name} ${last_name}`;
        }
        return ({
            narrative,
            user_details: name,
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

function SiteLogs (props) {
    const { width } = props;
    const classes = useStyles();
    const [table_data, setTableData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [sort, setSort] = useState({ order_by: "timestamp", order: "desc" });

    const [is_loading, setIsLoading] = useState(true);
    const [isOpenNarrativeModal, setIsOpenNarrativeModal] = useState(false);
    const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [chosenNarrative, setChosenNarrative] = useState({});
    const [isUpdateNeeded, setIsUpdateNeeded] = useState(true);
    const [alertsFromDbData, setAlertsFromDbData] = useState(null);
    const { setIsReconnecting } = useContext(GeneralContext);

    const { sites } = useContext(GeneralContext);

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

    useEffect(() => {
        if (isUpdateNeeded) {
            setIsLoading(true);
            const input = {
                include_count: true,
                limit: rowsPerPage, offset: page * rowsPerPage,
                filters, search_str,
                ...sort
            };

            getNarratives(input, ret => {
                const { narratives, count: total } = ret;
                const processed = processTableData(narratives);
                setTableData(processed);
                setCount(total);
                setIsLoading(false);
            });

            setIsUpdateNeeded(false);
        }
    }, [page, rowsPerPage, filters, search_str, sort, isUpdateNeeded]);

    const resetInput = (exclude_filters = false) => {
        setPage(0);
        if (!exclude_filters) setFilters([]);
        setSearchString("");
    };

    const handleBoolean = (data, bool) => () => {
        // NOTE: there was no need to use the bool for opening a modal or switch
        if (data === "is_narrative_modal_open") {
            setIsOpenNarrativeModal(!isOpenNarrativeModal);
            setIsEditMode(false);
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
            }
            
            const action_set = ["changePage", "changeRowsPerPage", "resetFilters"];
            if (action_set.includes(action)) setIsUpdateNeeded(true);
        },
        onColumnSortChange (column, direction) {
            const order = direction === "ascending" ? "asc" : "desc";
            setSort({ order_by: column, order });
            setIsUpdateNeeded(true);
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
            setIsUpdateNeeded(true);
        },
        // eslint-disable-next-line max-params
        customSearchRender: (searchText, handleSearch, hideSearch, s_options) => {
            const searchStr = searchText || "";

            const custom_on_hide_fn = () => {
                hideSearch();
                setSearchString("");
                setIsUpdateNeeded(true);
            };

            return (
                <CustomSearchRender
                    searchText={searchText}
                    onSearch={handleSearch}
                    onHide={custom_on_hide_fn}
                    options={s_options}
                    onSearchClick={() => {
                        resetInput(true);
                        setSearchString(searchStr);
                        setIsUpdateNeeded(true);
                    }}
                />
            );
        }
    };

    const columns = [
        {
            name: "id",
            label: "Log ID",
            options: {
                filter: false,
                display: false,
                sort: true
            }
        },
        {
            name: "timestamp",
            label: "Timestamp",
            options: {
                filter: false,
                sort: true,
                sortDirection: sort.order_by === "timestamp" ? sort.order : "none",
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
                    fullWidth: true,
                    logic (location, filterss) {
                        if (filterss.length) return !filterss.includes(location);
                        return false;
                    },
                    // eslint-disable-next-line max-params
                    display (filterList, onChange, index, column) {
                        const { latest, extended, overdue } = alertsFromDbData;
                        const merged_latest = [...latest, ...overdue];

                        return (
                            <FormControl>
                                <InputLabel>Site</InputLabel>
                                <Select
                                    multiple
                                    value={filterList[index]}
                                    renderValue={selected => selected.join(", ")}
                                    onChange={event => {
                                        // eslint-disable-next-line no-param-reassign
                                        filterList[index] = event.target.value;
                                        onChange(filterList[index], index, column);
                                    }}
                                >
                                    {
                                        filter_sites_option.map(site_code => {
                                            const sc = site_code.toLowerCase();
                                            const is_ev = merged_latest.find(x => x.event.site.site_code === sc);
                                            const is_ex = extended.find(x => x.event.site.site_code === sc);
                                            
                                            let color = classes.alert0;
                                            if (is_ev) { color = classes.alert3; }
                                            if (is_ex) { color = classes.extended; }

                                            const icon = is_ev || is_ex ? <ListItemIcon><Warning/></ListItemIcon> : "";

                                            return (
                                                <MenuItem key={site_code} value={site_code} className={color}>
                                                    <Checkbox
                                                        color="primary"
                                                        checked={filterList[index].indexOf(site_code) > -1}
                                                    />
                                                    <ListItemText primary={site_code} />
                                                    { icon }
                                                </MenuItem>
                                            );
                                        })
                                    }
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
                filter: true
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
                        setIsOpenDeleteModal, isOpenDeleteModal, setIsEditMode, isEditMode
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

            <Dialog open={is_loading} fullWidth>
                <DialogContent>
                    <div style={{ flexGrow: 1 }}>
                        <LinearProgress variant="query" color="secondary" />
                    </div>
                </DialogContent>
            </Dialog>

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
                chosenNarrative={chosenNarrative}
                isFromSiteLogs={alertsFromDbData}
                isEditMode={isEditMode}
                setSort={setSort}
                resetInput={resetInput}
            />

            <DeleteNarrativeModal
                isOpen={isOpenDeleteModal}
                closeHandler={handleBoolean("is_open_delete_modal", false)}
                chosenNarrative={chosenNarrative}
                setIsUpdateNeeded={setIsUpdateNeeded}
            />
        </Fragment>
    );
}

export default withWidth()(SiteLogs);
