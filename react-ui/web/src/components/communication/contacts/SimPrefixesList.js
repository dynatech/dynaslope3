import React, {
    useState, useEffect
} from "react";

import {
    Grid, Typography,
    List, ListItem,
    ListItemText
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

    return {
        globe,
        smart
    };
}

function SimPrefixesList (props) {
    const { sim_prefixes } = props;
    const groupedSimPrefixes = groupSimPrefixesByNetwork(sim_prefixes);
    const { globe, smart } = groupedSimPrefixes;
    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
                <List dense style={{ paddingTop: 0 }}>
                    <ListItem>
                        <ListItemText
                            primary={
                                <Grid 
                                    container
                                    spacing={0}
                                    justify="flex-start"
                                    alignItems="center"
                                >
                                    <Grid 
                                        item xl
                                        style={{ flexGrow: 1 }}
                                    >
                                        <Typography 
                                            variant="h6" 
                                            style={{ marginRight: 8 }}
                                        >Smart</Typography>
                                    </Grid>   
                                </Grid>
                            }
                        />
                    </ListItem>
                    {
                        smart.map(row => {
                            const prefix = `${row}`;
                            return (
                                <ListItem key={row}>
                                    <ListItemText
                                        primary={
                                            <Grid 
                                                container
                                                spacing={0}
                                                justify="flex-start"
                                                alignItems="center"
                                            >
                                                <Grid 
                                                    item xl
                                                    style={{ flexGrow: 1 }}
                                                >
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        style={{ marginRight: 8 }}
                                                    > {prefix}</Typography>
                                                </Grid>   
                                            </Grid>
                                        }
                                    />
                                </ListItem>
                            );
                        })
                        
                    }
                </List>
            </Grid>

            <Grid item xs={12} md={6}>
                <List dense style={{ paddingTop: 0 }}>
                    <ListItem>
                        <ListItemText
                            primary={
                                <Grid 
                                    container
                                    spacing={0}
                                    justify="flex-start"
                                    alignItems="center"
                                >
                                    <Grid 
                                        item xl
                                        style={{ flexGrow: 1 }}
                                    >
                                        <Typography 
                                            variant="h6" 
                                            style={{ marginRight: 8 }}
                                        >Globe</Typography>
                                    </Grid>   
                                </Grid>
                            }
                        />
                    </ListItem>
                    {
                        globe.map(row => {
                            const prefix = `${row}`;
                            return (
                                <ListItem key={row}>
                                    <ListItemText
                                        primary={
                                            <Grid 
                                                container
                                                spacing={0}
                                                justify="flex-start"
                                                alignItems="center"
                                            >
                                                <Grid 
                                                    item xl
                                                    style={{ flexGrow: 1 }}
                                                >
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        style={{ marginRight: 8 }}
                                                    > {prefix}</Typography>
                                                </Grid>   
                                            </Grid>
                                        }
                                    />
                                </ListItem>
                            );
                        })
                        
                    }
                </List>
            </Grid>
        </Grid>
    );
}

export default React.memo(SimPrefixesList);