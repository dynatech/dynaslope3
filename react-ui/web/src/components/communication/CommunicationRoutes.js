import React, { Fragment } from "react";
import { Route } from "react-router-dom";
import ChatterboxContainer from "./chatterbox/Container";

const CommunicationRoutes = () => (
    <Fragment>
        <Route path="/communication/chatterbox" render={props => <ChatterboxContainer {...props} />} />
    </Fragment>
);

export default CommunicationRoutes;
