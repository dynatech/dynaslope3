import React, { Fragment } from "react";
import {
    FormControl, InputLabel, Select,
    MenuItem, withStyles
} from "@material-ui/core";

const styles = theme => ({
    formControl: {
        minWidth: 120
    }
});

function SelectInputForm (props) {
    const {
        classes, list, mapping,
        label, div_id,
        changeHandler, value, css,
        error, required,
        disabled
    } = props;

    const is_required = typeof required !== "undefined" ? required : false;
    const is_error = typeof error !== "undefined" ? error : false;

    return (
        <Fragment>
            <FormControl 
                required={is_required}
                error={is_error}
                className={`${classes.formControl} ${css}`} 
                fullWidth
            >
                <InputLabel htmlFor={div_id}>{label}</InputLabel>
                <Select
                    value={value}
                    onChange={changeHandler}
                    name={div_id}
                    inputProps={{
                        id: div_id,
                    }}
                    disabled={disabled}
                >
                    <MenuItem value="">
                        <em>---</em>
                    </MenuItem>
                    {
                        list.map((item, i) => (
                            <MenuItem value={item[mapping.id]} key={i}>{item[mapping.label]}</MenuItem>
                        ))
                    }
                </Select>
            </FormControl>
        </Fragment>
    );
    
}

export default withStyles(styles)(SelectInputForm);
