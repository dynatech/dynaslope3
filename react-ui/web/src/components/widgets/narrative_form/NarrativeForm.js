import React from "react";
import {
    TextField, Grid, makeStyles,
    Typography, FormControlLabel,
    Checkbox, Tooltip
} from "@material-ui/core";

// Form Related Imports
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, TimePicker, DatePicker } from "@material-ui/pickers";

import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import DynaslopeUserSelectInputForm from "../../reusables/DynaslopeUserSelectInputForm";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        marginTop: 6,
        marginBottom: 6
    },
    checkboxGridContainer: {
        marginTop: 12,
        marginBottom: 6
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        width: "90%",
    },
    backButton: {
        marginRight: 1
    },
    instructions: {
        marginTop: 1,
        marginBottom: 1,
    }
}));

function NarrativeForm (props) {
    const classes = useStyles();
    const {
        narrativeData,
        setNarrativeData, siteList,
        setSiteList, isFromSiteLogs,
        callAck, setCallAck,
        callAckHashtag
    } = props;
    const {
        narrative, timestamp, user_id
    } = narrativeData;

    const handleDateTime = key => value => {
        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    const update_site_value = value => {
        setSiteList(value);
    };


    const handleEventChange = key => event => {
        const { value } = event.target;

        setNarrativeData({
            ...narrativeData,
            [key]: value  
        });
    };

    const handleCallAckOnCheck = event => {
        const { checked } = event.target;
        setCallAck(checked);

        let new_narrative = narrative;
        const with_space = ` ${callAckHashtag}`;
        if (checked) {
            if (narrative.length + with_space.length > 1000) {
                new_narrative.substring(0, 1000 - with_space.length);
            }
            
            new_narrative += with_space;
        } else {
            new_narrative = narrative.replace(with_space, "");
        }
        
        setNarrativeData({
            ...narrativeData,
            narrative: new_narrative
        });
    };

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
                container
                justify="space-evenly"
                alignItems="center"
                spacing={1}
            >
                <Grid item xs={12} className={classes.inputGridContainer}>
                    <DynaslopeSiteSelectInputForm 
                        value={siteList}
                        changeHandler={update_site_value}
                        isMulti
                        isFromSiteLogs ={isFromSiteLogs}         
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <DatePicker
                        required
                        autoOk
                        label="Date"
                        value={timestamp}
                        onChange={handleDateTime("timestamp")}
                        ampm={false}
                        placeholder="2020-01-01"
                        format="YYYY-MM-DD"
                        mask="____-__-__"
                        clearable
                        disableFuture
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} sm={6} className={classes.inputGridContainer}>
                    <TimePicker
                        required
                        autoOk
                        label="Time"
                        value={timestamp}
                        onChange={handleDateTime("timestamp")}
                        ampm={false}
                        placeholder="00:00"
                        format="HH:mm"
                        mask="__:__"
                        clearable
                        disableFuture
                        fullWidth
                    />
                </Grid>

                <Grid item xs={12} className={classes.inputGridContainer}>
                    <DynaslopeUserSelectInputForm
                        variant="standard"
                        label="Reporter"
                        div_id="user_id"
                        changeHandler={handleEventChange("user_id")}
                        value={user_id}
                        disabled
                    />
                </Grid>

                <Grid item xs={12} className={classes.inputGridContainer}>
                    <FormControlLabel
                        value="callAck"
                        control={<Checkbox 
                            color="primary" checked={callAck}
                            onClick={handleCallAckOnCheck}
                        />}
                        label={<div>
                            Early Warning Information (EWI) acknowledgement call&nbsp;
                            <Tooltip
                                title="Tick this if the log to enter is a call that acknowledges an EWI. This will add #EWIResponseCall on the narrative."><strong>[?]</strong>
                            </Tooltip>
                        </div>}
                        labelPlacement="end"
                    />
                </Grid>

                <Grid item xs={12} className={classes.inputGridContainer}>
                    <TextField
                        required
                        id="standard-multiline-static"
                        label="Narrative"
                        value={narrative}
                        onChange={handleEventChange("narrative")}
                        placeholder="Enter narrative"
                        multiline
                        rows="4"
                        rowsMax={4}
                        fullWidth
                        inputProps={{
                            maxLength: 1000
                        }}
                        variant="filled"
                    />
                    <Typography
                        component={Grid}
                        container justify="flex-end"
                        variant="caption"
                    >
                        Characters: {narrative.length}/1000
                    </Typography>
                </Grid>
            </Grid>
        </MuiPickersUtilsProvider>           
    );
}


export default NarrativeForm;
