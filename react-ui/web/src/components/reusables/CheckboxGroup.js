import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const styles = theme => ({
    checkboxes: {
        paddingTop: 4,
        paddingBottom: 4
    }
});

function CheckboxesGroup (props) {
    const {
        classes, label, changeHandler,
        choices, checkboxStyle
    } = props;

    return (
        <Fragment>
            {
                choices.map(({ state, value, label: clabel }, i) => (
                    <FormControlLabel
                        key={i}
                        control={
                            <Checkbox
                                checked={state}
                                onChange={changeHandler(value)}
                                value={value} 
                                className={classes.checkboxes}
                            />
                        }
                        label={clabel}
                        className={checkboxStyle}
                    />
                ))
            }
        </Fragment>
    );
}

export default withStyles(styles)(CheckboxesGroup);