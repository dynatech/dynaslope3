import React from "react";
import {
    Button
} from "@material-ui/core";

export default function InsertMomsButton (props) {
    const { clickHandler } = props;

    return (
        <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={clickHandler}
        >
            Insert MOMs
        </Button>
    );
}
