import React, { Fragment, useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Button, withStyles } from "@material-ui/core";
import GeneralStyles from "../../../GeneralStyles";

const goBack = (history, backHandler) => e => {
    e.preventDefault();
    backHandler();
    // history.goBack();
    history.push("/analysis/sites");
    history.replace("/analysis/sites");
};


function SubsurfaceGraph (props) {
    const { classes, history, match: { params: { tsm_sensor } }, backHandler } = props;

    const options = {
        title: {
            text: `<b>Subsurface Data of ${tsm_sensor.toUpperCase()}</b>`,
            style: { fontSize: "1rem" },
            margin: 36
        },
        series: [{
            data: [1, 2, 3]
        }]
    };

    return (
        <div className="page">
            <div className={classes.pageContentMargin} style={{ marginBottom: "-40px", marginTop: 20, marginRight: 18, position: "relative", zIndex: 2 }}>                
                <Button variant="contained" color="primary" size="small" onClick={goBack(history, backHandler)}>
                    Back
                </Button>           
            </div>

            <div className={classes.pageContentMargin}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
        </div>
    );
}

export default withStyles(GeneralStyles)(SubsurfaceGraph);