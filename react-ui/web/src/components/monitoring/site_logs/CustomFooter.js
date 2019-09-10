import React from "react";
import {
    TableFooter, TableRow, TableCell,
    TablePagination as MuiTablePagination, LinearProgress
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const defaultFooterStyles = {
};

class CustomFooter extends React.Component {

    handleRowChange = event => {
        this.props.changeRowsPerPage(event.target.value);
    };

    handlePageChange = (_, page) => {
        this.props.changePage(page);
    };

    render () {
        const {
            count, classes, textLabels, 
            rowsPerPage, page, isLoading
        } = this.props;

        const footerStyle = {
            display: "flex", 
            justifyContent: "flex-end",
            padding: "0px 24px 0px 24px"
        };

        console.log(isLoading);

        return (
            <TableFooter>
                <TableRow>
                    <TableCell style={footerStyle} colSpan={1000}>
                        {true && <div>
                            <LinearProgress variant="query" color="secondary" />
                        </div>}

                        <MuiTablePagination
                            component="div"
                            count={count}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            labelRowsPerPage={textLabels.rowsPerPage}
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${textLabels.pagination.displayRows} ${count}`}
                            backIconButtonProps={{
                                "aria-label": textLabels.previous,
                            }}
                            nextIconButtonProps={{
                                "aria-label": textLabels.next,
                            }}
                            rowsPerPageOptions={[10, 20, 100]}
                            onChangePage={this.handlePageChange}
                            onChangeRowsPerPage={this.handleRowChange}
                        />
                    </TableCell>
                </TableRow>
            </TableFooter>
        );
    }
}

export default withStyles(defaultFooterStyles, { name: "CustomFooter" })(CustomFooter);
