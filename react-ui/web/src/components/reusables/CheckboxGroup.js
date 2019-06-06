import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from "@material-ui/core/Checkbox";

const styles = theme => ({
    formControl: {
        padding: "6px 0",
        width: "-webkit-fill-available"
    },
    checkboxes: {
        paddingTop: 4,
        paddingBottom: 4
    },
    checkboxesGroup: {
        display: "flex",
        flexDirection: "column",
        [theme.breakpoints.up("sm")]: {
            flexDirection: "row",
            justifyContent: "space-between"
        }
    }
});

function CheckboxesGroup (props) {
    const { classes, label, changeHandler, choices } = props;

    return (
        <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">{label}</FormLabel>
            <FormGroup className={classes.checkboxesGroup}>
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
                        />
                    ))
                }
            </FormGroup>
            <FormHelperText>Add required if required</FormHelperText>
        </FormControl>
    );
}

export default withStyles(styles)(CheckboxesGroup);