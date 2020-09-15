import React, { useState, useEffect, Fragment } from "react";

import {
    Paper, LinearProgress,
    makeStyles, Dialog, DialogContent,
    Button, IconButton
} from "@material-ui/core";
import { AddAlert, Edit, Delete } from "@material-ui/icons";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MUIDataTable from "mui-datatables";

import CustomSearchRender from "./CustomSearchRender";
import { getIssuesAndReminders } from "../../widgets/issues_and_reminders_form/ajax";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import IssueReminderModal from "../../widgets/issues_and_reminders_form/IssuesAndReminderModal";

const sites_dict = {};

const useStyles = makeStyles(theme => ({
    ...GeneralStyles(theme),
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
}));

const getMuiTheme = createMuiTheme({
    overrides: {
        MUIDataTableHeadCell: {
            root: {
                zIndex: "0 !important"
            }
        }
    }
});

function getManipulationButtons (issue_and_reminder, data_handlers) {
    const { 
        setChosenIssueReminder, setIsOpenIssueReminderModal,
        setToResolve, setIsIandRUpdateNeeded
    } = data_handlers;

    const handleEdit = value => {
        setChosenIssueReminder(issue_and_reminder);
        setIsOpenIssueReminderModal(true);
        setIsIandRUpdateNeeded(true);
        setToResolve(false);
    };

    const handleDelete = value => {
        setChosenIssueReminder(issue_and_reminder);
        setIsOpenIssueReminderModal(true);
        setIsIandRUpdateNeeded(true);
        setToResolve(true);
    };

    const { ts_resolved, ts_expiration } = issue_and_reminder;
    const is_not_expired = moment().isBefore(ts_expiration) || ts_expiration === null;
    const to_show_delete = (ts_resolved === null) && (is_not_expired || ts_expiration === null);

    return (
        <span>
            {
                is_not_expired && (
                    <IconButton tooltip="Edit" style={{ "float": "left" }} onClick={handleEdit}>
                        <Edit style={{ fontSize: 20 }}/>
                    </IconButton>
                )
            }
            
            {
                to_show_delete && ( 
                    <IconButton tooltip="Delete" style={{ "float": "left" }} onClick={handleDelete}>
                        <Delete style={{ fontSize: 20 }}/>
                    </IconButton>
                )
            }

            {
                !is_not_expired && !to_show_delete && "Finished"
            }
        </span>          
    );
}

function IssuesAndReminders (props) {
    const { width } = props;
    const classes = useStyles();

    const [table_data, setTableData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState([]);
    const [filter_list, setFilterList] = useState([]);
    const [search_str, setSearchString] = useState("");
    const [on_search_open, setOnSearchOpen] = useState(false);
    const [is_loading, setIsLoading] = useState(true);
    const [isOpenIssueReminderModal, setIsOpenIssueReminderModal] = useState(false);

    const [chosenIssueReminder, setChosenIssueReminder] = useState({});
    const [isIandRUpdateNeeded, setIsIandRUpdateNeeded] = useState(false);
    const [toResolve, setToResolve] = useState(false);

    const [to_refresh, setToRefresh] = useState(true);

    useEffect(() => {
        setIsLoading(true);

        const input = {
            include_count: true,
            limit: rowsPerPage, offset: page * rowsPerPage,
            filters,
            search_str,
            include_expired: true
        };

        getIssuesAndReminders(input, ret => {
            const { issues_and_reminders, count: total } = ret;
            setTableData(issues_and_reminders);
            setCount(total);
            setIsLoading(false);
        });
    }, [
        page, rowsPerPage, filters, search_str,
        to_refresh
    ]);

    const handleBoolean = (data, bool) => () => {
        // NOTE: there was no need to use the bool for opening a modal or switch
        if (data === "is_issue_reminder_modal_open") {
            setIsOpenIssueReminderModal(bool);
            setIsIandRUpdateNeeded(false);
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
        responsive: isWidthUp(width, "xs") ? "standard" : "simple",
        serverSide: true,
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
            name: "ts_posted",
            label: "Date Posted",
            options: {
                filter: false,
                customBodyRender: value => {
                    return moment(value).format("DD MMMM YYYY, HH:mm:ss");
                }
            }
        },
        {
            name: "detail",
            label: "Details",
            options: {
                filter: false,
            }
        },
        {
            name: "reporter",
            label: "Reporter",
            options: {
                filter: true,
                customBodyRender: (value, { rowIndex }) => {
                    const row = table_data[rowIndex];
                    return `${row.issue_reporter.first_name} ${row.issue_reporter.last_name}`;
                }
            }
        },
        {
            name: "ts_expiration",
            label: "Posted Until",
            options: {
                filter: false,
                sort: false,
                customBodyRender: value => {
                    return value === null ? "-" : moment(value).format("DD MMMM YYYY, HH:mm:ss");
                }
            }
        },
        {
            name: "resolved_by",
            label: "Resolved By",
            options: {
                filter: false,
                customBodyRender: value => {
                    return value === null ? "-" : value;
                }
            }
        },
        {
            name: "resolution",
            label: "Resolution",
            options: {
                filter: false,
                customBodyRender: value => {
                    return value === null ? "-" : value;
                }
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
                    const { ts_expiration, resolution } = row;
                    
                    if (moment(ts_expiration).isAfter(moment()) || resolution !== null) {
                        return "Finished";
                    }

                    return getManipulationButtons(row, { 
                        setChosenIssueReminder, 
                        setIsOpenIssueReminderModal, isOpenIssueReminderModal,
                        setToResolve, setIsIandRUpdateNeeded
                    });
                }
            }
        }
    ];

    const is_desktop = isWidthUp("md", width);

    const custom_buttons = <span>
        <Button
            aria-label="Post an Issue or reminder"
            variant="contained"
            color="primary"
            size="small"
            style={{ marginRight: 8 }}
            onClick={handleBoolean("is_issue_reminder_modal_open", true)}
        >
            <AddAlert style={{ paddingRight: 4, fontSize: 20 }} />
            Post an Issue / Reminder
        </Button>
    </span>;

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle 
                    title="Alert Monitoring | Issues and Reminders" 
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
                            title="Issues and Reminders"
                            data={table_data}
                            columns={columns}
                            options={options}
                        />
                    </MuiThemeProvider>
                </Paper>
            </div>

            <IssueReminderModal
                isOpen={isOpenIssueReminderModal}
                closeHandler={handleBoolean("is_issue_reminder_modal_open", false)}
                isIandRUpdateNeeded={isIandRUpdateNeeded}
                setIsIandRUpdateNeeded = {setIsIandRUpdateNeeded}
                chosenIssueReminder={chosenIssueReminder}
                toResolve={toResolve}
                setToRefresh={setToRefresh}
                toRefresh={to_refresh}
            />
        </Fragment>
    );
}

export default withWidth()(IssuesAndReminders);
