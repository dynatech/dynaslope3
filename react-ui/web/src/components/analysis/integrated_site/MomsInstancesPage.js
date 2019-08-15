import React, { Fragment, useState, useEffect } from "react";
import { Route, Link } from "react-router-dom";

import { withStyles, Grid, Paper, Typography } from "@material-ui/core";
import MUIDataTable from "mui-datatables";
import moment from "moment";

import { getMOMsInstances } from "../ajax";

import GeneralStyles from "../../../GeneralStyles";
import BackToMainButton from "./BackToMainButton";


function formatTimestamp (ts) {
    return moment(ts).format("D MMM YYYY, HH:mm");
}

function buildName (name) {
    const { first_name, last_name } = name;
    return `${first_name} ${last_name}`;
}

function processMOMsReportData (moms) {
    const data = moms.map(report => {
        const {
            moms_id, observance_ts, narrative: n_details, reporter, validator
        } = report;
        const { narrative, timestamp: report_ts } = n_details;
        return [
            formatTimestamp(observance_ts), narrative, formatTimestamp(report_ts),
            buildName(reporter), buildName(validator)
        ];
    });

    return data;
}

function MomsInstancesPage (props) {
    const { classes, history, width,
        match: { 
            url, params: { site_code }
        }
    } = props;

    const [moms_data, setMOMsData] = useState([]);
    const [moms_features, setMOMsFeatures] = useState([]);
    const columns = ["Type",
        {
            name: "Name",
            options: {
                filter: false
            }
        }, {
            name: "Last Observance Timestamp",
            options: {
                filter: false
            }
        }, "Alert Level", {
            name: "data",
            options: {
                display: false,
                viewColumns: false,
                filter: false
            }
        }];

    useEffect(() => {
        getMOMsInstances(site_code, data => {
            const tbl_data = data.map(instance => {
                const {
                    feature: { feature_type },
                    feature_name, moms
                } = instance;

                const type = feature_type.charAt(0).toUpperCase() + feature_type.slice(1);
                const last_mom = moms[0];
                const { observance_ts, op_trigger } = last_mom;
                const ts = formatTimestamp(observance_ts);

                return [type, feature_name, ts, op_trigger, instance];    
            });

            const sorted_data = tbl_data.sort((a, b) => b[3] - a[3]);
            setMOMsFeatures(sorted_data);
            setMOMsData(data);
        });
    }, []);

    return (
        <Fragment>
            <BackToMainButton {...props} />

            <Paper style={{ marginTop: 16 }}>
                <MUIDataTable
                    title={`Manifestation of Movement Features of ${site_code.toUpperCase()}`}
                    columns={columns}
                    options={{
                        textLabels: {
                            body: {
                                noMatch: "No data"
                            }
                        },
                        selectableRows: "none",
                        rowsPerPage: 5,
                        rowsPerPageOptions: [],
                        print: false,
                        download: false,
                        responsive: "scroll",
                        onRowClick (data, meta, e) {
                            const { instance_id } = data[4];
                            history.push(`${url}/${instance_id}`);
                        }
                    }}
                    data={moms_features}
                />
            </Paper>
            
            <Route path={`${url}/:instance_id`} render={
                props => {
                    return <MOMsReportsTable 
                        {...props}
                        moms_data={moms_data}
                    />;
                }
            }/>
        </Fragment>
    );
}

function MOMsReportsTable (props) {
    const { moms_data, match: { params: { instance_id } } } = props;
    const columns = ["Observance Timestamp", "Narrative", "Report Timestamp", "Reporter", "Validator"];

    const instance_row = moms_data.find(row => row.instance_id === parseInt(instance_id, 10));
    let moms = [];
    let subtitle = "";
    if (typeof instance_row !== "undefined") {
        moms = instance_row.moms;

        const { feature: { feature_type }, feature_name } = instance_row;
        subtitle = `${feature_type} - ${feature_name}`;
    }

    const moms_reports = processMOMsReportData(moms);

    return (
        <Paper style={{ marginTop: 16 }}>
            <MUIDataTable
                title={
                    <Typography variant="h6">
                        Manifestation of Movement Reports <span style={{ fontSize: "small" }}>{subtitle.toUpperCase()}</span>
                    </Typography>
                }
                columns={columns}
                options={{
                    textLabels: {
                        body: {
                            noMatch: "No data"
                        }
                    },
                    selectableRows: "none",
                    rowsPerPage: 5,
                    rowsPerPageOptions: [],
                    print: false,
                    download: false,
                    responsive: "scroll",
                }}
                data={moms_reports}
            />
        </Paper>
    );
}

export default withStyles(GeneralStyles)(MomsInstancesPage);