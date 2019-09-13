import React, { useState, useEffect, Fragment } from "react";

import { 
    Paper, Typography, LinearProgress,
    withStyles, Dialog, DialogContent
} from "@material-ui/core";
import { ArrowForwardIos } from "@material-ui/icons";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardTimePicker } from "@material-ui/pickers";
import MUIDataTable from "mui-datatables";
import { compose } from "recompose";

import CustomSearchRender from "./CustomSearchRender";
import { getNarratives } from "../ajax";
import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { prepareSiteAddress } from "../../../UtilityFunctions";
import { sites } from "../../../store";

const filter_sites_option = [];
const sites_dict = {};

sites.forEach(site => {
    const address = prepareSiteAddress(site, true, "start");
    const site_code = site.site_code.toUpperCase();
    filter_sites_option.push(site_code);
    sites_dict[site_code] = site.site_id;
});

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

function processTableData (data) {
    const processed = data.map(row => (
        {
            ...row,
            site_name: prepareSiteAddress(row.site, true, "start"),
            ts: moment(row.timestamp).format("DD MMMM YYYY, HH:mm:ss"),
            type: 0,
            actions: "icon"
        }
    ));

    return processed;
}

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

    const [date, setDate] = useState(null); // useState(null);
    const [time, setTime] = useState(null);
    const [site_value, setSiteValue] = useState([]);
    const [narrative, setNarrative] = useState("");

    const set_date_fn = (value, str_val) => setDate(value);
    const set_time_fn = (value, str_val) => setTime(value);
    const update_site_value = value => setSiteValue(value);
    const set_narrative_fn = x => setNarrative(x.target.value);

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
    }, [page, rowsPerPage, filters, search_str]);
      
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
            name: "ts",
            label: "Timestamp",
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
            name: "actions",
            label: "Actions",
            options: {
                filter: false,
                sort: false
            }
        }
    ];

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Site Logs" />
            </div>

            {/* <div className={classes.pageContentMargin}>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    <Grid 
                        container
                        justify="space-between"
                        alignContent="center"
                        alignItems="center"
                        spacing={4}
                    >
                        <Grid container item xs={12} md={7} spacing={2}>
                            <Grid item xs={12} md={12}>
                                <DynaslopeSiteSelectInputForm
                                    value={site_value}
                                    changeHandler={update_site_value}
                                    isMulti
                                />
                            </Grid>

                            <Grid item xs={12} md={4} className={classes.inputGridContainer}>
                                <KeyboardDatePicker
                                    required
                                    autoOk
                                    label="Date"
                                    value={date}
                                    onChange={set_date_fn}
                                    placeholder="2010/01/01"
                                    format="YYYY/MM/DD"
                                    mask="__/__/____"
                                    clearable
                                    disableFuture
                                    variant="outlined"
                                    InputProps={{
                                        style: { paddingRight: 0 }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4} className={classes.inputGridContainer}>
                                <KeyboardTimePicker
                                    required
                                    autoOk
                                    ampm={false}
                                    label="Time"
                                    mask="__:__"
                                    placeholder="00:00"
                                    value={time}
                                    onChange={set_time_fn}
                                    clearable
                                />
                            </Grid>

                            <Grid item xs={12} md={4} className={classes.inputGridContainer}>
                                <SelectMultipleWithSuggest
                                    label="Log Type"
                                    options={[]}
                                    value={[]}
                                    changeHandler={() => {}}
                                    placeholder="Choose log type"
                                    renderDropdownIndicator
                                    isMulti={false}
                                />
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <TextField
                                id="message_textbox"
                                value={narrative}
                                onChange={set_narrative_fn}
                                label="Narrative"
                                multiline
                                rows="6"
                                // rowsMax={ limit ? 4 : 10 }
                                fullWidth
                                // className={classes.textBox}
                                inputProps={{ maxLength: 360 }}
                                margin="dense"
                                variant="filled"
                            />
                        </Grid>
                        
                        <Grid
                            item xs={12} md={12}
                            className={classes.buttonGrid}
                        >
                            <Button variant="contained" color="secondary" size={isWidthDown("sm", width) ? "small" : "medium"}>
                                    Insert <ArrowForwardIos className={classes.button} />
                            </Button>
                        </Grid>
                    </Grid>
                </MuiPickersUtilsProvider>
            </div> */}

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
                            // title={
                            //     <Typography variant="h6">
                            //         Site Logs
                            //         {is_loading && <LinearProgress variant="query" color="secondary" />}
                            //     </Typography>
                            // }
                            data={table_data}
                            columns={columns}
                            options={options}
                        />
                    </MuiThemeProvider>
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
)(SiteLogs);
