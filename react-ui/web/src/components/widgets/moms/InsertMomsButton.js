import React from "react";
import { Button } from "@material-ui/core";
import { Landscape } from "@material-ui/icons";

export default function InsertMomsButton (props) {
    const { clickHandler } = props;

    return (
        <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={clickHandler}
            startIcon={<Landscape />}
        >
            Insert MOMs
        </Button>
    );
}
