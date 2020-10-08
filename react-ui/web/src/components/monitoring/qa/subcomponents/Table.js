import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import MUIDataTable from "mui-datatables";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import _ from "lodash";
import {
    CircularProgress, Typography,
    makeStyles
} from "@material-ui/core";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import GeneralStyles from "../../../../GeneralStyles";

const useStyles = makeStyles(theme => ({
    ...GeneralStyles(theme),
    eventTable: {
        minWidth: "900px"
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

function QATable (props) {

    const {
        width, isLoading, columns, type, datas, shift_start_ts
    } = props;

    const classes = useStyles();
    const [data, setData] = useState(datas);
    const [cols, setCols] = useState([]);

    const sites_count = _(data)
    .groupBy("site_name")
    .map((items, name) => { 
        return name;
    })
    .value().length;

    useEffect(() => {
        columns.map((col, index) =>{
            switch (col.name) {
                case "ewi_sms": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            const limit = moment(limit_start);
                            const sent_ts = moment(value);
                            sites_count > 5 ? limit.add(sites_count, "minutes") : limit.add(5, "minutes");
                            if (type === "Lowering") limit.add(15, "minutes");
                            const error = sent_ts > limit;

                            return (
                                <span style={{ color: error ? "red" : "" }} >{value}</span>
                            );
                        },
                    };  
                }
                    break;

                case "ewi_bulletin_release" && type !== "Routine": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            let limit = moment(limit_start).add(10, "minutes");
                            const sent_ts = moment(value);
                            if (sites_count > 5) limit = limit_start.add((sites_count * 2), "minutes");
                            if (type === "Lowering") limit.add(15, "minutes");
                            const error = sent_ts > limit;

                            return (
                                <span style={{ color: error ? "red" : "" }} >{value}</span>
                            );
                        },
                    };  
                }
                    break;
                case "rainfall_info": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            const limit = moment(limit_start).add(15, "minutes");
                            const sent_ts = moment(value);
                            // if(sites_count > 5) limit = limit_start.add((sites_count * 2), "minutes");
                            const error = sent_ts > limit;

                            return (
                                <span style={{ color: error ? "red" : "" }} >{value}</span>
                            );
                        },
                    };  
                }
                    break;
                case "ground_measurement": {
                    col.options = {
                        ...col.options,
                        customBodyRender: (value, tableMeta, updateValue) => {
                            const limit_start = moment(tableMeta.tableData[tableMeta.rowIndex].ts_limit_start).format("YYYY-MM-DD HH:mm:ss");
                            const start_limit = moment(limit_start).subtract(2.5, "hours");
                            const end_limit = moment(limit_start).subtract(2, "hours");
                            const sent_ts = moment(value);
                            const error = !!(sent_ts >= start_limit && sent_ts <= end_limit);

                            return (
                                <span style={{ color: error ? "red" : "" }} >{value}</span>
                            );
                        },
                    };  
                }
                    break;
            }
            
        });
        setCols(columns);
    }, [columns, datas]);

    const options = {
        textLabels: {
            body: {
                noMatch: `No ${type} event(s)`,
            }
        },
        responsive: isWidthUp(width, "xs") ? "scroll" : "scrollFullHeight",
        filter: true,
        selectableRows: "none",
        print: true,
        download: true,
        downloadOptions: {
            filename: `${type}_releases_${shift_start_ts}.csv`,
            separator: ";",
        },
        filterType: "dropdown",
        onTableChange: (action, tableState) => {
            if (action === "resetFilters") {
                setData(datas);
            }
            if (action === "propsUpdate") {
                setData(datas);
            }
        },
    };

    return (
        <Fragment>
            <div>
                <MuiThemeProvider theme={getMuiTheme}>
                    <MUIDataTable
                        title={
                            <div>
                                <Typography variant="h5" component="div">
                                    {type} releases
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
                            </div>
                        }
                        data={data}
                        columns={cols}
                        options={options}
                    />
                </MuiThemeProvider>                           
            </div>
        </Fragment>
    );
}

export default withWidth()(QATable);
