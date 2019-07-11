import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
    FormControl, InputLabel, Select,
    MenuItem, withStyles, OutlinedInput
} from "@material-ui/core";

const styles = theme => ({
    formControl: {
        minWidth: 120
    }
});

class OutlinedSelectInputForm extends Component {
    state = {
        labelWidth: 0
    }

    componentDidMount () {
        this.setState({
            labelWidth: ReactDOM.findDOMNode(this.InputLabelRef).offsetWidth,
        });
    }

    render () {
        const {
            classes, list, mapping,
            label, div_id,
            changeHandler, value, css
        } = this.props;
        const { labelWidth } = this.state;

        return (
            <FormControl required variant="outlined" className={`${classes.formControl} ${css}`}>
                <InputLabel
                    ref={ref => {
                        this.InputLabelRef = ref;
                    }} 
                    htmlFor={div_id}
                >
                    {label}
                </InputLabel>
                <Select
                    value={value}
                    onChange={changeHandler}
                    name={div_id}
                    input={
                        <OutlinedInput
                            labelWidth={labelWidth}
                            id={div_id}
                        />
                    }
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
}

export default withStyles(styles)(OutlinedSelectInputForm);
