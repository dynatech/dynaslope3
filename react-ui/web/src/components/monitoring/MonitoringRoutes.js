import React, { Fragment } from "react";
import { Route } from "react-router-dom";
import DashboardContainer from "./dashboard/Container";
import EventsTableContainer from "./events_table/Container";
import ShiftsAndReportsContainer from "./shifts_and_reports/Container";

const MonitoringRoutes = () => (
    <Fragment>
        <Route exact path="/" component={DashboardContainer} />
        <Route path="/monitoring/events" component={EventsTableContainer} />
        <Route path="/monitoring/shifts_and_reports" component={ShiftsAndReportsContainer} />
    </Fragment>
);

export default MonitoringRoutes;
