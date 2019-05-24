import React from "react";
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
        changeHandler, value, css
    } = props;

    return (
        <FormControl required className={`${classes.formControl} ${css}`}>
            <InputLabel htmlFor={div_id}>{label}</InputLabel>
            <Select
                value={value}
                onChange={changeHandler}
                name={div_id}
                inputProps={{
                    id: div_id,
                }}
                fullWidth
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
    );
    
}

export default withStyles(styles)(SelectInputForm);
