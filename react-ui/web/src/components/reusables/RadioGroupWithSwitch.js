import React, { Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
// import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
// import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Switch from "@material-ui/core/Switch";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";

const styles = theme => ({
    formControl: {
        width: "-webkit-fill-available"
    },
    formLabel: {
        justifyContent: "space-between",
        marginLeft: 0,
    },
    radios: {
        paddingTop: 4,
        paddingBottom: 4
    },
    radioGroup: {
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
        classes, id, label,
        changeHandler, radioValue, choices, 
        switchState, switchValue, switchHandler
    } = props;

    return (
        <FormControl component="fieldset" className={classes.formControl}>
            {/* <FormLabel component="legend" className={classes.formLabel}>
                <span>{label}</span>

                <Switch
                    checked={switchState}
                    onChange={switchHandler}
                    value={switchValue}
                />
            </FormLabel> */}

            <FormControlLabel
                className={classes.formLabel}
                control={<Switch
                    checked={switchState}
                    onChange={switchHandler}
                    value={switchValue}
                />}
                label={label}
                labelPlacement="start"
            />

            {
                switchState ? (
                    <Fragment>
                        <RadioGroup 
                            className={classes.radioGroup}
                            aria-label={label}
                            name={id}
                            value={radioValue}
                            onChange={changeHandler}
                        >
                            {
                                choices.map(({ value, label: clabel }, i) => (
                                    <FormControlLabel
                                        key={i}
                                        value={value}
                                        control={
                                            <Radio className={classes.radios} />
                                        }
                                        label={clabel}
                                    />
                                ))
                            }
                        </RadioGroup>
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