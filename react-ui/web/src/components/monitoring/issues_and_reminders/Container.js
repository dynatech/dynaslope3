import React, { useState, useEffect, Fragment } from "react";

import {
    Paper, LinearProgress,
    withStyles, Dialog, DialogContent,
    Button, IconButton
} from "@material-ui/core";
import { AddAlert, Edit, Delete } from "@material-ui/icons";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MUIDataTable from "mui-datatables";
import { compose } from "recompose";

import CustomSearchRender from "./CustomSearchRender";
import { getIssuesAndReminders } from "../../widgets/issues_and_reminders_form/ajax";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import IssueReminderModal from "../../widgets/issues_and_reminders_form/IssuesAndReminderModal";

const sites_dict = {};

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


function getManipulationButtons (issue_and_reminder, data_handlers) {
    const { 
        setChosenIssueReminder, setIsOpenIssueReminderModal,
        setIsOpenDeleteModal } = data_handlers;

    const handleEdit = value => {
        setChosenIssueReminder(issue_and_reminder);
        setIsOpenIssueReminderModal(true);
    };

    const handleDelete = value => {
        setChosenIssueReminder(issue_and_reminder);
        setIsOpenDeleteModal(true);
    };

    return (
        <span>
            <IconButton tooltip="Edit" style={{ "float": "left" }} onClick={handleEdit}>
                <Edit style={{ fontSize: 20 }}/>
            </IconButton>
            {issue_and_reminder.type_id === 1 && ( 
                <IconButton tooltip="Delete" style={{ "float": "left" }} onClick={handleDelete}>
                    <Delete style={{ fontSize: 20 }}/>
                </IconButton>
            )}
        </span>        
    );
}


function processTableData (data, data_handlers) {
    const processed = data.map(row => (
        {
            ...row,
            // NOTE: PARKING SITE LIST DUE TO NEEDS MULTIPLE VALUES
            // site_list: prepareSiteAddress(),
            reporter: `${row.issue_reporter.first_name} ${row.issue_reporter.last_name}`,
            ts_posted: moment(row.ts_posted).format("DD MMMM YYYY, HH:mm:ss"),
            ts_posted_until: moment(row.ts_posted_until).format("DD MMMM YYYY, HH:mm:ss"),
            resolved_by: row.resolved_by,
            resolution: row.resolution,
            actions: getManipulationButtons(row, data_handlers)
        }
    ));

    return processed;
}


function IssuesAndReminders (props) {
    const { classes, width } = props;
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
    const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

    const [chosenIssueReminder, setChosenIssueReminder] = useState({});
    const [isUpdateNeeded, setIsUpdateNeeded] = useState(false);


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
            const processed = processTableData(
                issues_and_reminders, 
                { 
                    setChosenIssueReminder, 
                    setIsOpenIssueReminderModal, isOpenIssueReminderModal,
                    setIsOpenDeleteModal, isOpenDeleteModal
                });
            setTableData(processed);
            setCount(total);
            setIsLoading(false);
        });
    }, [
        page, rowsPerPage, filters, 
        search_str, isUpdateNeeded, 
        isOpenDeleteModal, 
        isOpenIssueReminderModal
    ]);

    const handleBoolean = (data, bool) => () => {
        // NOTE: there was no need to use the bool for opening a modal or switch
        if (data === "is_issue_reminder_modal_open") {
            setIsOpenIssueReminderModal(!isOpenIssueReminderModal);
        } 
        // else if (data === "is_open_delete_modal") {
        //     setIsOpenDeleteModal(!isOpenDeleteModal);
        // }
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
            }
        },
        // {
        //     name: "site_name",
        //     label: "Site",
        //     options: {
        //         filter: true,
        //         filterList: typeof filter_list.site_name === "undefined" ? [] : filter_list.site_name,
        //         filterOptions: {
        //             names: filter_sites_option
        //         }
        //     }
        // },
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
            }
        },
        {
            name: "ts_posted_until",
            label: "Posted Until",
            options: {
                filter: false,
                sort: false
            }
        },
        {
            name: "resolved_by",
            label: "Resolved By",
            options: {
                filter: false,
            }
        },
        {
            name: "resolution",
            label: "Resolution",
            options: {
                filter: false,
            }
        },
        {
            name: "actions",
            label: "Actions",
            options: {
                filter: false,
                sort: false
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
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
                chosenIssueReminder={chosenIssueReminder}
            />

            {/* <DeleteNarrativeModal
                isOpen={isOpenDeleteModal}
                closeHandler={handleBoolean("is_open_delete_modal", false)}
                chosenIssueReminder={chosenIssueReminder}
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
            /> */}
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
)(IssuesAndReminders);
