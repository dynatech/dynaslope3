import React from "react";
import { Route, Switch } from "react-router-dom";

import DashboardContainer from "./components/monitoring/dashboard/Container";
import EventsTableContainer from "./components/monitoring/events_table/Container";
import ShiftsAndReportsContainer from "./components/monitoring/shifts_and_reports/Container";
import SiteLogsContainer from "./components/monitoring/site_logs/Container";

import IntegratedSiteAnalysisContainer from "./components/analysis/integrated_site/Container";

import ChatterboxContainer from "./components/communication/chatterbox/Container";

function RoutesCollection () {
    return (
        <Switch>
            <Route exact path="/" component={DashboardContainer} />
            <Route path="/monitoring/events" component={EventsTableContainer} />
            <Route path="/monitoring/shifts_and_reports" component={ShiftsAndReportsContainer} />
            <Route path="/monitoring/logs" component={SiteLogsContainer} />
            <Route path="/monitoring" render={
                () => <h3> Not yet created</h3>
            } />

            <Route path="/analysis/sites" component={IntegratedSiteAnalysisContainer} />
            <Route path="/analysis" render={
                () => <h3> Not yet created</h3>
            } />

            <Route path="/communication/chatterbox" render={props => <ChatterboxContainer {...props} />} />
            <Route path="/communication" render={
                () => <h3> Not yet created</h3>
            } />

            <Route render={
                () => <h3> Not found</h3>
            } />
        </Switch>
    );
}

export default RoutesCollection;