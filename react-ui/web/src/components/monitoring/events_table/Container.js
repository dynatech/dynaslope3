import React, { useState, useEffect, Component, Fragment } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { TableHead } from "@material-ui/core";
import { withStyles, makeStyles, useTheme } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";

import PageTitle from "../../reusables/PageTitle";
import GeneralStyles from "../../../GeneralStyles";

const styles = theme => ({
    eventTable: {
        minWidth: "900px"
    }
});

const useStyles1 = makeStyles(theme => ({
    root: {
        flexShrink: 0,
        color: theme.palette.text.secondary,
    },
}));

function TablePaginationActions (props) {
    const classes = useStyles1();
    const theme = useTheme();
    const { count, page, rowsPerPage, onChangePage } = props;

    function handleFirstPageButtonClick (event) {
        onChangePage(event, 0);
    }

    function handleBackButtonClick (event) {
        onChangePage(event, page - 1);
    }

    function handleNextButtonClick (event) {
        onChangePage(event, page + 1);
    }

    function handleLastPageButtonClick (event) {
        onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    }

    return (
        <div className={classes.root}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="First Page"
            >
                {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="Previous Page">
                {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="Next Page"
            >
                {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="Last Page"
            >
                {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </div>
    );
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onChangePage: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

// function createData (event_id, site, entry_type, ts_start, ts_end) {
//     return { event_id, site, entry_type, ts_start, ts_end };
// }

// const rows = prepRow();
// function prepRow () {
//     const temp = [];
//     for (let i = 0; i < 50; i += 1) {
//         let insert_data = null;
//         if ((i % 2) === 1) insert_data = createData(
//             123,
//             "PLA (Planas, Guihulngan City, Negros Oriental)",
//             "EVENT",
//             "24 January 2019, 11:30 AM",
//             "27 January 2019, 11:30 AM");
//         else insert_data = createData(
//             321,
//             "PLA (Planas, Guihulngan City, Negros Oriental)",
//             "ROUTINE",
//             "24 January 2019, 11:30 AM",
//             "-");
//         temp.push(insert_data);
//     }
//     return temp;
// }

function getEventsData (offset, limit, setRowDataState) {
    let data;
    axios.get(`http://127.0.0.1:5000/api/monitoring/get_monitoring_events?filter_type=complete&offset=${offset}&limit=${limit}`)
    .then(response => {
        data = prepareEventsArray(response.data);
        setRowDataState(data);
    })
    .catch(error => {
        console.log(error);
    });
    return data;
}


function prepareSiteAddress (site_code, purok, sitio, barangay, municipality, province) {
    let temp = `${site_code.toUpperCase()} (`;
    if (purok !== null) temp += `${sitio}, `;
    if (sitio !== null) temp += `${sitio}, `;

    const site_address = `${temp}${barangay}, ${municipality}, ${province})`;
    return site_address;
}

function prepareEventsArray (arr) {
    console.log("arr", arr);
    return arr.map(
        ({
            event_id, site_code, purok,
            sitio, barangay, municipality,
            province, entry_type, ts_start,
            ts_end
        }) => {
            return (
                {
                    event_id,
                    site: prepareSiteAddress(site_code, purok, sitio, barangay, municipality, province),
                    entry_type,
                    ts_start,
                    ts_end
                }
            );
        });
}

function MonitoringEventsTable (props) {
    const { classes } = props;
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [rowDataState, setRowDataState] = useState([]);
    const [dataLength, setDataLength] = useState(10000);

    useEffect(() => {
        const offset = page * rowsPerPage;
        const limit = page * rowsPerPage + rowsPerPage;
        getEventsData(offset, limit, setRowDataState);

    }, [page, rowsPerPage]);

    console.log(rowDataState.length);

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rowDataState.length - page * rowsPerPage);

    function handleChangePage (event, newPage) {
        setPage(newPage);
    }

    function handleChangeRowsPerPage (event) {
        setRowsPerPage(parseInt(event.target.value, 10));
    }

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Events" />
            </div>
            <div className={`${classes.pageContentMargin}`}>
                <Paper className={classes.paperContainer}>
                    <Table className={classes.eventTable}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="right" component="th" scope="row">
                                    Event ID
                                </TableCell>
                                <TableCell align="right">Site</TableCell>
                                <TableCell align="right">Monitoring Type</TableCell>
                                <TableCell align="right">Start</TableCell>
                                <TableCell align="right">End</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rowDataState.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell align="right" component="th" scope="row">
                                        {row.event_id}
                                    </TableCell>
                                    <TableCell align="right">{row.site}</TableCell>
                                    <TableCell align="right">{row.entry_type}</TableCell>
                                    <TableCell align="right">{row.ts_start}</TableCell>
                                    <TableCell align="right">{row.ts_end}</TableCell>
                                </TableRow>
                            ))}

                            {emptyRows > 0 && (
                                <TableRow style={{ height: 48 * emptyRows }}>
                                    <TableCell colSpan={10} />
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    colSpan={5}
                                    // count={rowDataState.length}
                                    count={dataLength}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    SelectProps={{
                                        inputProps: { "aria-label": "Rows per page" },
                                        "native": true,
                                    }}
                                    onChangePage={handleChangePage}
                                    onChangeRowsPerPage={handleChangeRowsPerPage}
                                    ActionsComponent={TablePaginationActions}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
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
)(MonitoringEventsTable);
