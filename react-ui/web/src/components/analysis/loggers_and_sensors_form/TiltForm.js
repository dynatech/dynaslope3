import React, { useReducer, useState, useEffect } from "react";

import {
    Grid, FormControl, TextField,
    Typography, Card, CardContent
} from "@material-ui/core";

import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";

function sanitizeData (data) {
    const get_value = obj => {
        return Object.keys(obj).reduce((bank, key) => {
            const temp_bank = { ...bank };
            const { value } = obj[key];
            let temp_value = value;
    
            if (typeof value === "undefined") {
                temp_value = get_value(obj[key]);
            }
            
            if (value === "") {
                temp_value = null;
            }

            if (key === "site") {
                temp_value = value.data;
            }

            if (moment.isMoment(value)) {
                temp_value = value.format("YYYY-MM-DD HH:mm:ss");
            }
    
            temp_bank[key] = temp_value;
            return temp_bank;
        }, {});
    };

    const clean_data = get_value(data);
    return clean_data;
}

let getHelperText = null;
function reducerFunction (state, action) {
    const { type, field, value } = action;
    const field_value = state[field];

    const new_value = value;
    const test_helper_value = value;

    const { required } = field_value;
    const new_helper_text = getHelperText(field, test_helper_value, required);

    switch (type) {
        case "UPDATE":
            return { ...state, [field]: {
                ...field_value,
                value: new_value,
                helper_text: new_helper_text
            } };
        default:
            return { ...state };
    }
}

function TiltForm (props) {
    const {
        onTiltFormUpdate, initReducer, getHelperText: ght,
        checkInputFields
    } = props;
    getHelperText = ght;

    const initial_data = {
        date_activated: null,
        version: "",
        segment_length: "",
        number_of_segment: ""
    };
    const [segment_list, setSegmentList] = useState([]);
    const [tsm_data, dispatch] = useReducer(reducerFunction, initial_data, initReducer);

    const onNumberOfSegmentChange = value => {
        dispatch({ type: "UPDATE", field: "number_of_segment", value });
        const len = value !== "" ? parseInt(value, 10) : 0;
        const arr = Array.from(Array(len), (v, i) => null);
        setSegmentList([...arr]);
    };
    
    const onSegmentInputChange = (value, index) => {
        const copy = [...segment_list];
        copy[index] = value;
        setSegmentList(copy);
    };

    useEffect(() => {
        const has_reg_error = checkInputFields(tsm_data);
        const has_segment_error = segment_list.some(x => x === null || x === "");
        const has_error = has_reg_error || has_segment_error;
        
        const value = {
            ...tsm_data,
            segment_list: {
                value: segment_list
            }
        };

        const clean_data = sanitizeData(value);
        onTiltFormUpdate(clean_data, has_error);
    }, [tsm_data, segment_list]);

    return (
        <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
            <Typography variant="h6" display="block" component={Grid} item xs={12}>
                <strong>Tilt Sensor</strong>
            </Typography>

            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid item xs={6} md={3}>
                    <KeyboardDatePicker
                        autoOk
                        label="Date Activated"
                        value={tsm_data.date_activated.value || null}
                        onChange={e => dispatch({ type: "UPDATE", field: "date_activated", value: e })}
                        helperText={tsm_data.date_activated.helper_text || ""}
                        error={Boolean(tsm_data.date_activated.helper_text)}
                        ampm={false}
                        placeholder="2010/01/01"
                        format="YYYY/MM/DD"
                        mask="____/__/__"
                        clearable
                        disableFuture
                        fullWidth
                    />
                </Grid> 
            </MuiPickersUtilsProvider>

            <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                    <TextField
                        required
                        label="Version"
                        type="number"
                        value={tsm_data.version.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "version", value: e.target.value })}
                        helperText={tsm_data.version.helper_text || ""}
                        error={Boolean(tsm_data.version.helper_text)}
                    />
                </FormControl>
            </Grid>

            <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                    <TextField
                        required
                        label="Segment Length"
                        type="number"
                        value={tsm_data.segment_length.value}
                        onChange={e => dispatch({ type: "UPDATE", field: "segment_length", value: e.target.value })}
                        helperText={tsm_data.segment_length.helper_text || ""}
                        error={Boolean(tsm_data.segment_length.helper_text)}
                    />
                </FormControl>
            </Grid>

            <Grid item xs={6} md={4}>
                <FormControl fullWidth>
                    <TextField
                        required
                        label="Number of Segment"
                        type="number"
                        value={tsm_data.number_of_segment.value}
                        onChange={e => onNumberOfSegmentChange(e.target.value)}
                        helperText={tsm_data.number_of_segment.helper_text || ""}
                        error={Boolean(tsm_data.number_of_segment.helper_text)}
                    />
                </FormControl>
            </Grid>
                    
            {
                segment_list.length !== 0 && (
                    <Typography variant="overline" display="block" component={Grid} item xs={12}>
                        Segments
                    </Typography>
                )
            }

            {
                segment_list.length !== 0 && (
                    segment_list.map((value, i) => (
                        <Grid item xs={4} sm={3} lg={2} key={`segment_container_${i + 1}`}>
                            <FormControl fullWidth>
                                <TextField
                                    required
                                    label={`Segment ${i + 1}`}
                                    key={`segment_${i + 1}`}
                                    type="number"
                                    placeholder="Enter ID"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    value={value || ""}
                                    onChange={e => onSegmentInputChange(e.target.value, i)}
                                    helperText={value === "" ? "Required field" : ""}
                                    error={Boolean(value === "")}
                                />
                            </FormControl>
                        </Grid>
                    ))
                )
            }
        </CardContent></Card>
    );
}

export default TiltForm;