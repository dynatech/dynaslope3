import React, { useState, useEffect, Fragment } from "react";

import {
    Grid, Button, FormHelperText,
    CircularProgress, Select, MenuItem,
    FormControl, Paper
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";

import MomentUtils from "@date-io/moment";
import moment from "moment";

import { createDateTime } from "../shifts_and_reports/EndOfShiftGenerator";
import { getMonitoringReleases } from "../ajax";
import SelectInputForm from "../../reusables/SelectInputForm";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

// subComponents
import Event from "./subcomponents/Event";
import Lowering from "./subcomponents/Lowering";
import Extended from "./subcomponents/Extended";
import Routine from "./subcomponents/Routine";
import Raising from "./subcomponents/Raising";

const useStyles = makeStyles((theme) => ({
    ...GeneralStyles(theme),
    root: {
        display: "flex",
        flexGrow: 1,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        overFlowY: "auto",
    },
}));

function NoQAData (props) {
    const { isStart } = props;
    const is_start = isStart === "undefined" ? false : isStart;
    let message = "No available data for QA";
    if (is_start) {
        message = "Select shift to generate data for QA";
    }
    return (
        <Paper
            style={{
                height: "20vh", padding: 60, display: "flex",
                justifyContent: "center", alignItems: "center",
                background: "gainsboro", border: "4px solid #CCCCCC"
            }}
        >
            <div>{message}</div>
        </Paper>
    );
}

const TabComponents = (props) => {
    const { 
        selectedTab, eventData, loweringData,
        extendedData, routineData, raisingData 
    } = props;

    const components = [
        <Event releasesData={eventData} {...props}/>,
        <Lowering releasesData={loweringData} {...props}/>,
        <Extended releasesData={extendedData} {...props}/>,
        <Routine releasesData={routineData} {...props}/>,
        <Raising releasesData={raisingData} {...props}/>
    ];
    return components[selectedTab];
};

export default function QAContainer () {
    const classes = useStyles();
    const [selectedTab, setSelectedTab] = useState(0);
    const datetime_now = moment();
    const dt_hr = datetime_now.hour();
    const [start_ts, setStartTs] = useState(datetime_now.format("YYYY-MM-DD"));
    const [shift_time, setShiftTime] = useState(dt_hr >= 10 && dt_hr <= 22 ? "am" : "pm");
    const [isLoading, setIsLoading] = useState(false);
    const [releasesData, setReleases] = useState(null);
    const [shift_start_ts, setShiftStartTs] = useState(null);

    const [event_releases, setEventReleases] = useState([]);
    const [routine_releases, setRoutineReleases] = useState([]);
    const [extended_releases, setExtendedReleases] = useState([]);
    const [lowering_releases, setLoweringReleases] = useState([]);
    const [raising_releases, setRaisingReleases] = useState([]);

    const handleDateTime = value => {
        setStartTs(value);
    };

    const handleClick = () => {
        setIsLoading(true);
        const ts = getMonitoringReleases({ start_ts, shift_time }, setReleases);
        setShiftStartTs(ts);
    };

    useEffect(() => {
        if (releasesData !== null) {
            if (releasesData.raising.length > 0) setRaisingReleases(releasesData.raising);
            if (releasesData.event.length > 0)setEventReleases(releasesData.event);
            if (releasesData.routine.length > 0)setRoutineReleases(releasesData.routine);
            if (releasesData.extended.length > 0)setExtendedReleases(releasesData.extended);
            if (releasesData.lowering.length > 0)setLoweringReleases(releasesData.lowering);
            setIsLoading(false);
        }
    }, [releasesData]);
    
    useEffect(() => {
        // function changes default Tab to Monitoring Type with largest data size
        const monTypes = [
            event_releases.length, 
            lowering_releases.length, 
            extended_releases.length, 
            routine_releases.length,
            raising_releases.length,
        ];
        setSelectedTab(monTypes.indexOf(Math.max(...monTypes)));

    }, [event_releases, routine_releases, lowering_releases, extended_releases, raising_releases]);

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Quality Assurance"/>
            </div>

            <div className={classes.pageContentMargin}>
                <Grid container spacing={2}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid 
                            container
                            justify="space-between"
                            alignContent="center"
                            alignItems="center"
                            spacing={2}
                            item xs={12}
                            style={{ marginBottom: 8 }}
                        >
                            {
                                [
                                    { label: "Shift Start", value: start_ts, id: "start_ts" },
                                ].map(row => {
                                    const { id } = row;

                                    return (
                                        <Grid item xs={12} sm key={id} className={classes.inputGridContainer}>
                                            { createDateTime(row, handleDateTime) }
                                        </Grid>
                                    );
                                })
                            }

                            <Grid item xs={12} sm>
                                <SelectInputForm
                                    div_id="shift_time"
                                    label="Shift Time"
                                    changeHandler={event => setShiftTime(event.target.value)}
                                    value={shift_time}
                                    list={[{ id: "am", label: "AM" }, { id: "pm", label: "PM" }]}
                                    mapping={{ id: "id", label: "label" }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm align="right">
                                <Button 
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleClick}
                                    endIcon={<ArrowForwardIosIcon className={classes.button} />}
                                >
                                    Generate 
                                </Button>
                            </Grid>
                        </Grid>
                    </MuiPickersUtilsProvider>
                    
                    { releasesData !== null && releasesData.length !== 0 ? (
                        <Fragment>
                            <Grid item xs={12} sm container justify="flex-end">
                                <FormControl>
                                    <Select
                                        value={selectedTab}
                                        onChange={e=> setSelectedTab(e.target.value)}
                                        style={{ width: 200 }}
                                        autoFocus
                                    >
                                        <MenuItem value={0}>{`Event (${event_releases.length})`}</MenuItem>
                                        <MenuItem value={4}>{`Raising (${raising_releases.length})`}</MenuItem>
                                        <MenuItem value={1}>{`Lowering (${lowering_releases.length})`}</MenuItem>
                                        <MenuItem value={2}>{`Extended (${extended_releases.length})`}</MenuItem>
                                        <MenuItem value={3}>{`Routine (${routine_releases.length})`}</MenuItem>
                                    </Select>
                                    <FormHelperText>Select monitoring type to display</FormHelperText>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <TabComponents 
                                    routineData={routine_releases} 
                                    eventData={event_releases}
                                    loweringData={lowering_releases}
                                    extendedData={extended_releases}
                                    raisingData={raising_releases}
                                    isLoading={isLoading} 
                                    shift_start_ts={shift_start_ts}
                                    selectedTab={selectedTab}
                                />
                            </Grid>
                        </Fragment>
                    ) : (
                        <Grid item xs={12} align="center">
                            {
                                // eslint-disable-next-line no-nested-ternary
                                isLoading ? (
                                    <CircularProgress/>
                                ) : (
                                    shift_start_ts !== null && releasesData !== null && releasesData.length === 0 ? 
                                        <NoQAData /> : <NoQAData isStart />
                                )
                            }
                        </Grid>
                    ) }
                </Grid>
            </div>
        </Fragment>
    ); }