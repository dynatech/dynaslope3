import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import { Grid, Button, FormHelperText, Tooltip, CircularProgress, InputLabel, Select,
MenuItem, FormControl } from "@material-ui/core";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import moment from "moment";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import { createDateTime } from "../shifts_and_reports/EndOfShiftGenerator";
import { getMonitoringReleases } from "../ajax";
import SelectInputForm from "../../reusables/SelectInputForm";
import GeneralStyles from "../../../GeneralStyles";
// subComponents
import Event from "./subcomponents/Event";
import Lowering from "./subcomponents/Lowering";
import Extended from "./subcomponents/Extended";
import Routine from "./subcomponents/Routine";
import PageTitle from "../../reusables/PageTitle";

const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
    ...GeneralStyles(theme),
    root: {
        display: "flex",
        flexGrow: 1,
    },

    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
        padding: 20,
    },
    drawerContainer: {
        overflow: "auto",
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        overFlowY: "auto",
    },
}));

const TabCompenents = (props) => {
    const { selectedTab, 
        eventData, loweringData, extendedData, routineData } = props;
    const components = [
        <Event releasesData={eventData} {...props}/>,
        <Lowering releasesData={loweringData} {...props}/>,
        <Extended releasesData={extendedData} {...props}/>,
        <Routine releasesData={routineData} {...props}/>
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
    const [selectedEosData, setSelectedEosData] = useState(null);
    const [shift_start_ts, setShiftStartTs] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [event_releases, setEventReleases] = useState([]);
    const [routine_releases, setRoutineReleases] = useState([]);
    const [extended_releases, setExtendedReleases] = useState([]);
    const [lowering_releases, setLoweringReleases] = useState([]);

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
            const routineTemp = [];
            const eventTemp = [];
            const extendedTemp = [];
            const loweringTemp = [];
            releasesData.forEach((row) => {
                const data_ts = moment(row.data_ts).format();
                const validity = row.event_alert.event.validity;
                const pub_alert_level = row.event_alert.public_alert_symbol.alert_level;
                const pub_alert_type = row.event_alert.public_alert_symbol.alert_type;
                const end_val_data_ts = moment(validity).subtract(30, "minutes").format();
                const temp = {
                    ewi_web_release: row.release_time,
                    site_id: row.event_alert.event.site.site_id,
                    site_name: row.event_alert.event.site.site_code.toUpperCase(),
                    bulletin_release: row.bulletin_number,
                    ewi_sms: row.is_sms_sent,
                    ewi_bulletin_release: row.is_bulletin_sent,
                    ground_measurement: row.ground_measurement,
                    ground_data: row.ground_data,
                    rainfall_info: row.rainfall_info,
                    fyi_permission: row.fyi,
                    ts_limit_start: row.nearest_release_ts
                };
            if(pub_alert_type === "routine") {
                
                if (end_val_data_ts === data_ts && pub_alert_level === 0) {
                    loweringTemp.push(temp);
                }else{
                    routineTemp.push(temp);
                }
            }else{
                if (end_val_data_ts > data_ts) {
                    eventTemp.push(temp);
                }
                if (end_val_data_ts < data_ts) {
                    extendedTemp.push(temp);
                } 
                }
            });

            setEventReleases(eventTemp);
            setRoutineReleases(routineTemp);
            setExtendedReleases(extendedTemp);
            setLoweringReleases(loweringTemp);
            setIsLoading(false);
        }
    }, [releasesData]);
    
    const closeDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleChangeTab = (index) => {
        setSelectedTab(index);
        closeDrawer();
    };

    return (
        <div className={classes.pageContentMargin}>
            <CssBaseline />
            <PageTitle title="Quality Assurance page"/>
            <main className={classes.content}>
                <Grid container spacing={2} >
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid 
                            container
                            justify="space-between"
                            alignContent="center"
                            alignItems="center"
                            spacing={4}
                            // style={{ display: hidden ? "none !important" : "" }}
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

                            <Grid item xs={12} sm className={`${classes.inputGridContainer} ${classes.buttonGrid}`}>
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
                        <>
                            <Grid item xs={12} sm style={{display:"flex", justifyContent:"flex-end"}}>
                                <FormControl>
                                    <Select
                                        value={selectedTab}
                                        onChange={e=> setSelectedTab(e.target.value)}
                                        style={{width: 200}}
                                        autoFocus
                                    >
                                        <MenuItem value={0}>{`Event (${event_releases.length})`}</MenuItem>
                                        <MenuItem value={1}>{`Lowering (${lowering_releases.length})`}</MenuItem>
                                        <MenuItem value={2}>{`Extended (${extended_releases.length})`}</MenuItem>
                                        <MenuItem value={3}>{`Routine (${routine_releases.length})`}</MenuItem>
                                    </Select>
                                    <FormHelperText>Select monitoring type to display</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TabCompenents 
                                    routineData={routine_releases} 
                                    eventData={event_releases}
                                    loweringData={lowering_releases}
                                    extendedData={extended_releases}
                                    isLoading={isLoading} 
                                    shift_start_ts={shift_start_ts}
                                    selectedTab={selectedTab}
                                />
                            </Grid>
                        </>
                
                    ) : (
              
                        <div className={classes.root} style={{ marginTop: "10%" }}>
                            <Grid container justify="center">
                                <Grid item>
                                    {isLoading ? (
                                        <CircularProgress/>
                                    ) : (
                                        shift_start_ts !== null && releasesData !== null && releasesData.length === 0 ? 
                                            <Typography>No available data for <strong>{moment(shift_start_ts).format("dddd, MMMM DD, YYYY A")} shift</strong></Typography>
                                            : <Typography>Select shift</Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </div>
                    )
                    }
                </Grid>
            </main>
        </div>
    ); }