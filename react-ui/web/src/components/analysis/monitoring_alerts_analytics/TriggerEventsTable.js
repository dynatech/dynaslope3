import React from "react";

import { Button } from "@material-ui/core";
import MUIDataTable from "mui-datatables";
import moment from "moment";
import { prepareSiteAddress } from "../../../UtilityFunctions";

function TriggerEventsTable (props) {
    const { selectedTrigger, history } = props;
    const { alert_events, name } = selectedTrigger;

    const table_options = {
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
        responsive: "simple"
    };

    const columns = [
        { name: "Event ID" },
        { name: "Site" },
        { name: "Event Start" },
        { name: "Validity" }
    ];

    const data = alert_events.map(row => {
        const { event_id, site, event_start, validity } = row;
        return [
            <Button
                onClick={ret => history.push(`/monitoring/events/${event_id}`)}
                style={{ color: "blue" }}
            >
                <u>{event_id}</u>
            </Button>,
            prepareSiteAddress(site),
            moment(event_start).format("DD MMMM YYYY, HH:mm"),
            moment(validity).format("DD MMMM YYYY, HH:mm")
        ];
    });

    return (
        <MUIDataTable
            title={`Monitoring Events with "${name}" trigger`}
            columns={columns}
            options={table_options}
            data={data}
        />
    );
}

export default TriggerEventsTable;