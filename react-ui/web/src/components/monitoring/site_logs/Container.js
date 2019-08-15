import React, { useState, useEffect, Fragment } from "react";

import { 
    Paper, Grid, Button, 
    withStyles, TextField, TableRow, TableCell
} from "@material-ui/core";
import { ArrowForwardIos } from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardTimePicker } from "@material-ui/pickers";
import MUIDataTable from "mui-datatables";
import axios from "axios";

import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import SelectMultipleWithSuggest from "../../reusables/SelectMultipleWithSuggest";

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

function SiteLogs (props) {
    const { classes, width } = props;
    // const [data, setData] = useState([["Loading Data..."]]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [count, setCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);


    const [date, setDate] = useState(null); // useState(null);
    const [time, setTime] = useState(null);
    const [site_value, setSiteValue] = useState([]);
    const [narrative, setNarrative] = useState("");

    const set_date_fn = (value, str_val) => setDate(value);
    const set_time_fn = (value, str_val) => setTime(value);
    const update_site_value = value => setSiteValue(value);
    const set_narrative_fn = x => setNarrative(x.target.value);

    useEffect(() => {
        axios.get("http://192.168.150.167:5000/api/narratives/get_narratives/2018-08-20 18:30:00/2018-08-29 18:30:00")
        .then(ret => {
            const { data } = ret;

        });
    });

    // const options = {
    //     filter: true,
    //     selectableRows: "none",
    //     print: false,
    //     download: false,
    //     filterType: "dropdown",
    //     responsive: "scroll",
    //     serverSide: true,
    //     count: 100,
    //     page: 1,
    //     rowsPerPageOptions: [5, 10, 15, 25, 50],
    //     rowsPerPage: 10
    // };

    // const options = {
    //     textLabels: {
    //         body: {
    //             noMatch: "No data"
    //         }
    //     },
    //     selectableRows: "none",
    //     rowsPerPage: 5,
    //     rowsPerPageOptions: [],
    //     print: false,
    //     download: false,
    //     search: false,
    //     filter: false,
    //     viewColumns: false,
    //     responsive: "scroll"
    // };


    const columns = [
        {
            name: "Site",
            options: {
                filter: true,
            }
        },
        {
            name: "Timestamp",
            options: {
                filter: false,
            }
        },
        {
            name: "Narrative",
            options: {
                filter: false,
            }
        },
        {
            name: "Type",
            options: {
                filter: true,
            }
        },
        {
            name: "Actions",
            options: {
                filter: false,
                sort: false
            }
        }
    ];
  
    const data = [
        ["Gabby George", "Business Analyst", "Minneapolis", 30, "$100,000"],
        ["Aiden Lloyd", "Business Consultant", "Dallas", 55, "$200,000"],
        ["Jaden Collins", "Attorney", "Santa Ana", 27, "$500,000"],
        ["Franky Rees", "Business Analyst", "St. Petersburg", 22, "$50,000"],
        ["Aaren Rose", "Business Consultant", "Toledo", 28, "$75,000"],
        ["Blake Duncan", "Business Management Analyst", "San Diego", 65, "$94,000"],
        ["Frankie Parry", "Agency Legal Counsel", "Jacksonville", 71, "$210,000"],
        ["Lane Wilson", "Commercial Specialist", "Omaha", 19, "$65,000"],
        ["Robin Duncan", "Business Analyst", "Los Angeles", 20, "$77,000"],
        ["Mel Brooks", "Business Consultant", "Oklahoma City", 37, "$135,000"],
        ["Harper White", "Attorney", "Pittsburgh", 52, "$420,000"],
        ["Kris Humphrey", "Agency Legal Counsel", "Laredo", 30, "$150,000"],
        ["Frankie Long", "Industrial Analyst", "Austin", 31, "$170,000"],
        ["Brynn Robbins", "Business Analyst", "Norfolk", 22, "$90,000"],
        ["Justice Mann", "Business Consultant", "Chicago", 24, "$133,000"],
        ["Addison Navarro", "Business Management Analyst", "New York", 50, "$295,000"],
        ["Jesse Welch", "Agency Legal Counsel", "Seattle", 28, "$200,000"],
        ["Eli Mejia", "Commercial Specialist", "Long Beach", 65, "$400,000"],
        ["Gene Leblanc", "Industrial Analyst", "Hartford", 34, "$110,000"],
        ["Danny Leon", "Computer Scientist", "Newark", 60, "$220,000"],
        ["Lane Lee", "Corporate Counselor", "Cincinnati", 52, "$180,000"],
        ["Jesse Hall", "Business Analyst", "Baltimore", 44, "$99,000"],
        ["Danni Hudson", "Agency Legal Counsel", "Tampa", 37, "$90,000"],
        ["Terry Macdonald", "Commercial Specialist", "Miami", 39, "$140,000"],
        ["Justice Mccarthy", "Attorney", "Tucson", 26, "$330,000"],
        ["Silver Carey", "Computer Scientist", "Memphis", 47, "$250,000"],
        ["Franky Miles", "Industrial Analyst", "Buffalo", 49, "$190,000"],
        ["Glen Nixon", "Corporate Counselor", "Arlington", 44, "$80,000"],
        ["Gabby Strickland", "Business Process Consultant", "Scottsdale", 26, "$45,000"],
        ["Mason Ray", "Computer Scientist", "San Francisco", 39, "$142,000"]
    ];
  
    const options = {
        filter: true,
        filterType: "dropdown",
        responsive: "scroll",
        expandableRows: true,
        expandableRowsOnClick: false,
        rowsExpanded: [0, 2, 3],
        renderExpandableRow: (rowData, rowMeta) => {
            const colSpan = rowData.length + 1;
            return (
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        Custom expandable row option. Data: {JSON.stringify(rowData)}
                    </TableCell>
                </TableRow>
            );
        }
    };

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

            <div className={classes.pageContentMargin}>
                <Paper className={classes.paperContainer}>
                    <MuiThemeProvider theme={getMuiTheme}>
                        <MUIDataTable
                            title="Site Logs"
                            // data={[]}
                            // columns={}
                            data={data}
                            columns={columns}
                            options={options}
                        />
                    </MuiThemeProvider>
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
)(SiteLogs);
