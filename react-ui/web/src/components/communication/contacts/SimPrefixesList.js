import React, { Fragment } from "react";

import {
    Grid, Typography, Paper
} from "@material-ui/core";

function groupSimPrefixesByNetwork (sim_prefixes) {
    const smart = [];
    const globe = [];

    sim_prefixes.forEach(row => {
        const { prefix, network_id } = row;
        const prefix_code = `0${prefix}`;
        if (network_id === 1) {
            globe.push(prefix_code);
        } else {
            smart.push(prefix_code);
        }
    });

    return [
        { network: "Globe", prefixes: globe },
        { network: "Smart", prefixes: smart }
    ];
}

function SimGroup (props) {
    const { row: { network, prefixes } } = props;

    return (
        <Fragment>
            <Typography 
                variant="h5"
                style={{ marginBottom: 12 }}
            >
                {network}
            </Typography>

            <Paper style={{ padding: "24px 16px" }}>
                <Grid
                    container spacing={3}
                >
                    {
                        prefixes.map(row => {
                            return (
                                <Typography 
                                    variant="body1"
                                    component={Grid}
                                    item xs={2}
                                    align="center"
                                    key={row}
                                >
                                    {row}
                                </Typography>
                            );
                        })
                    }
                </Grid>
            </Paper>
        </Fragment>
    );
}

function SimPrefixesList (props) {
    const { sim_prefixes } = props;
    const groups = groupSimPrefixesByNetwork(sim_prefixes);

    return (
        <Fragment>
            {
                groups.map(row => (
                    <Fragment key={row.network}>
                        <SimGroup row={row} />
                        <div style={{ marginBottom: 24 }} />
                    </Fragment>
                ))
            }
        </Fragment>
    );
}

export default React.memo(SimPrefixesList);