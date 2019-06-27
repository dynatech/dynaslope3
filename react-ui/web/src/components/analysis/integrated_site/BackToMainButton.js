
import React from "react";

import { Button, IconButton } from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";

const goBack = history => e => {
    e.preventDefault();
    history.push("/analysis/sites");
    history.replace("/analysis/sites");
};

function BackToMainButton (props) {
    const { width, history } = props;

    return (
        isWidthDown(width, "sm") ? (<Button
            variant="contained"
            color="primary"
            size="small" 
            onClick={goBack(history)}
        >
            <ArrowBackIos style={{ fontSize: 16 }}/> Back
        </Button>) : (<IconButton
            variant="contained"
            color="primary"
            size="small" 
            onClick={goBack(history)}
            style={{ marginLeft: 6 }}
        >
            <ArrowBackIos />
        </IconButton>)
    );
}

export default BackToMainButton;
