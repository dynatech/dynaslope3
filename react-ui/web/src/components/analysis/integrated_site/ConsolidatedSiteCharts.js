import React, { Fragment } from "react";
import moment from "moment";
import { withStyles } from "@material-ui/core";
import GeneralStyles from "../../../GeneralStyles";
import BackToMainButton from "./BackToMainButton";

function ConsolidatedSiteCharts (props) {
    const { 
        classes, history, width,
        match: { params: { site_code } },
        location
    } = props;

    console.log(location.site);

    return (
        <Fragment>
            <BackToMainButton {...props} />

            
        </Fragment>
    );
}

export default withStyles(GeneralStyles)(ConsolidatedSiteCharts);
