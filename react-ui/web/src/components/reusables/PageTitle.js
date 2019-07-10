import React from "react";
import { Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    pageTitleContainer: {
        margin: "24px 0 18px",
        [theme.breakpoints.down("sm")]: {
            margin: "10px 0 10px",
        }
    },
    pageTitle: {
        fontSize: "0.85rem"
    },
    hasCustomButtons: {
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        paddingTop: 12,
        paddingBottom: 12
    }
});

function PageTitle ({ title, classes, customButtons }) {
    const has_custom_buttons = customButtons === undefined
        ? false
        : customButtons;

    let c_classes = classes.pageTitleContainer;
    if (has_custom_buttons) c_classes += ` ${classes.hasCustomButtons}`;

    return (
        <div className={c_classes}>
            <Typography variant="overline" className={classes.pageTitle}>{ title }</Typography>

            {customButtons}
        </div>
    );
}

export default withStyles(styles)(PageTitle);