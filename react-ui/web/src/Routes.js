import React, { Fragment } from "react";
// import { Route, Switch } from "react-router-dom";
import MonitoringRoutes from "./components/monitoring/MonitoringRoutes";
import CommunicationRoutes from "./components/communication/CommunicationRoutes";

function RoutesCollection () {
    return (
        <Fragment>
            <MonitoringRoutes />
            <CommunicationRoutes />
            {/* <Route render={
                () => <h3> Not found</h3>
            } /> */}
        </Fragment>
    );
}

export default RoutesCollection;