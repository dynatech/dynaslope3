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
    }
});

function PageTitle ({ title, classes }) {
    return (
        <div className={classes.pageTitleContainer}>
            <Typography variant="overline" className={classes.pageTitle}>{ title }</Typography>
        </div>
    );
}

export default withStyles(styles)(PageTitle);