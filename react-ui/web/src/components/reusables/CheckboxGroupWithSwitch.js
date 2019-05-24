import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Switch from "@material-ui/core/Switch";
import Checkbox from "@material-ui/core/Checkbox";

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
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
    const { 
        classes, switchState, switchHandler, 
        switchValue, label, changeHandler, 
        choices 
    } = props;

    return (
        <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend" className={classes.formLabel}>
                <span>{label}</span>

                <Switch
                    checked={switchState}
                    onChange={switchHandler}
                    value={switchValue}
                />
            </FormLabel>

            {
                switchState ? (
                    <Fragment>
                        <FormGroup className={classes.checkboxesGroup}>
                            {
                                choices.map(({ state, value, label: clabel }, i) => {
                                    const { status, disabled } = state;
                                    
                                    return (
                                        <FormControlLabel
                                            key={i}
                                            control={
                                                <Checkbox
                                                    checked={status}
                                                    onChange={changeHandler(value)}
                                                    value={value} 
                                                    className={classes.checkboxes}
                                                    disabled={disabled}
                                                />
                                            }
                                            label={clabel}
                                        />
                                    );
                                })
                            }
                        </FormGroup>
                        <FormHelperText>Add required if required</FormHelperText>
                    </Fragment>
                ) : (
                    <div />
                )
            }
        </FormControl>
    );
}

export default withStyles(styles)(CheckboxesGroup);