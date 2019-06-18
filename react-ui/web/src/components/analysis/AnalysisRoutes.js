import React, { Fragment } from "react";
import { Route } from "react-router-dom";
import IntegratedSiteAnalysisContainer from "./integrated_site/Container";

const AnalysisRoutes = () => (
    <Fragment>
        <Route path="/analysis/sites" component={IntegratedSiteAnalysisContainer} />
    </Fragment>
);

export default AnalysisRoutes;
