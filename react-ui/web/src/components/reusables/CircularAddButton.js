import React from "react";
import {
    Fab, withStyles
} from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import AddIcon from "@material-ui/icons/Add";
import { compose } from "recompose";

const styles = theme => ({
    fab: {
        position: "fixed",
        bottom: theme.spacing.unit * 2,
        right: theme.spacing.unit * 2,
        zIndex: 1
    }
});

function CircularAddButton (props) {
    const { classes, clickHandler, width } = props;

    return (
        <Fab 
            color="secondary" 
            aria-label="Add" 
            className={classes.fab}
            size={isWidthUp("md", width) ? "large" : "medium"}
            onClick={clickHandler}
        >
            <AddIcon />
        </Fab>
    );
}

export default compose(
    withStyles(styles),
    withWidth()
)(CircularAddButton);
