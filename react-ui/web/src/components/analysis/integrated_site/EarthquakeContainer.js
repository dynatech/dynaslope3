import React from "react";

import {
    AppBar, Tabs, Tab,
    Typography, Grid
} from "@material-ui/core";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import MUIDataTable from "mui-datatables";
import moment from "moment";

import EarthquakeMap from "./EarthquakeMap";

const getMuiTheme = createMuiTheme({
    overrides: {
        MUIDataTableBodyCell: {
            root: {
                whiteSpace: "nowrap"
            }
        }
    }
});

const eq_ev_tbl_columns = [
    { name: "Timestamp" },
    { name: "Magnitude" },
    { name: "Issuer" },
    {
        name: "eq_id",
        options: {
            display: false,
            viewColumns: false,
            filter: false
        }
    }
];

const eq_al_tbl_columns = [
    { name: "Timestamp" },
    { name: "Magnitude" },
    {
        name: "eq_id",
        options: {
            display: false,
            viewColumns: false,
            filter: false
        }
    },
    {
        name: "Sites",
        options: {
            filter: false
        }
    }
];


function EarthquakeContainer (props) {
    const {
        eqEvents, eqAlerts,
        eqAlertsPagination, setEqAlTblPage
    } = props;

    const [tab_value, setTabValue] = React.useState(0);
    const change_tab_value = (event, new_value) => setTabValue(new_value);
    
    const [chosen_events, setChosenEvents] = React.useState([]);
    const [eq_ev_tbl_data, setEqEventsTable] = React.useState([]);
    React.useEffect(() => {
        setChosenEvents([...eqEvents]);
        const table_data = eqEvents.map(d => [
            moment(d.ts).format("D MMM YYYY, HH:mm"), 
            parseFloat(d.magnitude),
            d.issuer.toUpperCase(),
            d.eq_id
        ]);
        setEqEventsTable([...table_data]);
    }, [eqEvents]);

    const select_map_event = (eq_id, collection) => {
        const event = collection.filter(ev => ev.eq_id === eq_id);
        setChosenEvents([...event]);
    };

    const [eq_al_tbl_data, setEqAlertsTable] = React.useState([]);
    React.useEffect(() => {
        const table_data = eqAlerts.map(d => {
            const { eq_alerts } = d;
            const sites = eq_alerts.map(a => a.site.site_code.toUpperCase());
            
            return [
                moment(d.ts).format("D MMM YYYY, HH:mm"), 
                parseFloat(d.magnitude),
                d.eq_id,
                sites.join(", ")
            ];
        });

        setEqAlertsTable([...table_data]);
    }, [eqAlerts]);

    const eq_ev_tbl_options = {
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
        search: false,
        filter: false,
        viewColumns: false,
        responsive: "standard",
        onRowClick (data, meta, e) {
            select_map_event(data[3], eqEvents);
        }
    };

    const eq_al_tbl_options = {
        textLabels: {
            body: {
                noMatch: "No data"
            }
        },
        selectableRows: "none",
        count: eqAlertsPagination.count,
        rowsPerPage: 3,
        rowsPerPageOptions: [],
        print: false,
        download: false,
        viewColumns: false,
        responsive: "standard",
        serverSide: true,
        onChangePage: page => {
            const { limit } = eqAlertsPagination;
            const offset = page * limit;
            setEqAlTblPage({ ...eqAlertsPagination, offset });
        },
        onRowClick (data, meta, e) {
            select_map_event(data[2], eqAlerts);
        }
    };

    return (
        <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
                <EarthquakeMap eqEvents={chosen_events} zoomIn={chosen_events.length === 1}/>
            </Grid>

            <Grid item xs={12} md={6}>
                <AppBar position="static">
                    <Tabs
                        value={tab_value}
                        onChange={change_tab_value}
                        variant="fullWidth"
                    >
                        <Tab label="EQ Events" />
                        <Tab label="EQ Alerts" />
                    </Tabs>
                </AppBar>
                {
                    tab_value === 0 && (
                        <MuiThemeProvider theme={getMuiTheme}>
                            <MUIDataTable
                                title="Latest Earthquake Events"
                                columns={eq_ev_tbl_columns}
                                options={eq_ev_tbl_options}
                                data={eq_ev_tbl_data}
                                style={{ height: 465 }}
                            />
                        </MuiThemeProvider>
                    )
                }
                {
                    tab_value === 1 && (
                        <MuiThemeProvider theme={getMuiTheme}>
                            <MUIDataTable
                                title={
                                    <Typography
                                        variant="body1"
                                    >
                                        Earthquake Alerts
                                    </Typography>
                                }
                                columns={eq_al_tbl_columns}
                                options={eq_al_tbl_options}
                                data={eq_al_tbl_data}
                            />
                        </MuiThemeProvider>
                    )
                }
            </Grid>
        </Grid>
    );
}

export default EarthquakeContainer;
