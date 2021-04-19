import React from "react";
import { Button } from "@material-ui/core";
import { NotificationImportant } from "@material-ui/icons";

export default function InserOnDemandButton (props) {
    const { clickHandler } = props;

    return (
        <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={clickHandler}
            startIcon={<NotificationImportant />}
        >
            Insert On Demand
        </Button>
    );
}
