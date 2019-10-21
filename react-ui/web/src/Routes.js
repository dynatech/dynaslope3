import React from "react";
import { Route, Switch } from "react-router-dom";

import DashboardContainer from "./components/monitoring/dashboard/Container";
import EventsTableContainer from "./components/monitoring/events_table/Container";
import ShiftsAndReportsContainer from "./components/monitoring/shifts_and_reports/Container";
import SiteLogsContainer from "./components/monitoring/site_logs/Container";

import IntegratedSiteAnalysisContainer from "./components/analysis/integrated_site/Container";

import ChatterboxContainer from "./components/communication/chatterbox/Container";
import ContactsContainer from "./components/communication/contacts/Container";


function RoutesCollection (props) {
    const { 
        location, match: { url }
    } = props;

    return (

        <Switch location={location}>
            <Route exact path={url} component={DashboardContainer} />
            <Route path={`${url}monitoring/events`} component={EventsTableContainer} />
            <Route path={`${url}monitoring/shifts_and_reports`} component={ShiftsAndReportsContainer} />
            <Route path={`${url}monitoring/logs`} component={SiteLogsContainer} />
            <Route path={`${url}monitoring`} render={() => <h3> Not yet created</h3>} />

            <Route path={`${url}analysis/sites`} component={IntegratedSiteAnalysisContainer} />
            <Route path={`${url}analysis`} render={() => <h3> Not yet created</h3>} />

            <Route path={`${url}communication/chatterbox`} component={ChatterboxContainer} />
            <Route path={`${url}communication/contacts`} component={ContactsContainer} />
            <Route path={`${url}communication`} render={() => <h3> Not yet created</h3>} />

            <Route render={() => <h3> Not found</h3>} />
        </Switch>

    );

}

export default RoutesCollection;