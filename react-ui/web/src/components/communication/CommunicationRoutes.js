import React, { Fragment } from "react";
import { Route } from "react-router-dom";
import ChatterboxContainer from "./chatterbox/Container";
import ConversationWindow from "./chatterbox/ConversationWindow";

const CommunicationRoutes = () => (
    <Fragment>
        <Route path="/communication/chatterbox" render={props => <ChatterboxContainer {...props} />} />
        {/* <Route path="/communication/chatterbox/:id" render={() => <ConversationWindow />} /> */}
    </Fragment>
);

export default CommunicationRoutes;
