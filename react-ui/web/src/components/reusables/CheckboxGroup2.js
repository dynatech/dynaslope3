import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Grid } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const styles = theme => ({
    checkboxes: {
        paddingTop: 4,
        paddingBottom: 4
    }
});

function returnGridAligned (choices, changeHandler, classes, checkboxStyle) {
    return (
        <Grid container>
            {
                choices.map(({ state, value, label: clabel, is_disabled }, i) => (
                    <Grid item xs={2}>
                        <FormControlLabel
                            key={i}
                            control={
                                <Checkbox
                                    checked={state}
                                    onChange={changeHandler(value)}
                                    value={value}
                                    disabled={
                                        typeof is_disabled === "undefined" ?
                                            false : is_disabled
                                    }
                                    className={classes.checkboxes}
                                />
                            }
                            label={clabel}
                            className={checkboxStyle}
                        />
                    </Grid>
                ))
            }
        </Grid>
    );
}

function CheckboxesGroup (props) {
    const {
        classes, label, changeHandler,
        choices, checkboxStyle, gridAligned
    } = props;

    return (
        <Fragment>
            {
                gridAligned ? 
                    choices.map(({ state, value, label: clabel, is_disabled }, i) => (
                        <FormControlLabel
                            key={i}
                            control={
                                <Checkbox
                                    checked={state}
                                    onChange={changeHandler(value)}
                                    value={value}
                                    disabled={
                                        typeof is_disabled === "undefined" ?
                                            false : is_disabled
                                    }
                                    className={classes.checkboxes}
                                />
                            }
                            label={clabel}
                            className={checkboxStyle}
                        />
                    ))
                    : 
                    returnGridAligned(choices, changeHandler, classes, checkboxStyle)
            }
        </Fragment>
    );
}

export default withStyles(styles)(CheckboxesGroup);