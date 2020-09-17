import React, { useState } from "react";
import ContentLoader from "react-content-loader";
import moment from "moment";
import { Grid, makeStyles, Button, withWidth, Paper } from "@material-ui/core";
import { isWidthDown } from "@material-ui/core/withWidth";
import { ArrowForwardIos } from "@material-ui/icons";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import DetailedExpansionPanels from "./DetailedExpansionPanels";
import SelectInputForm from "../../reusables/SelectInputForm";
import SelectSiteModal from "./SelectSiteModal";

import { getEndOfShiftReports } from "../ajax";
import { getCurrentUser } from "../../sessions/auth";

const useStyles = makeStyles(theme => ({
    inputGridContainer: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "0 0"
        }
    },
    AccordionsGroup: {
        margin: "12px 0",
        [theme.breakpoints.down("sm")]: {
            margin: "24px 0"
        },
        marginTop: 16
    },
    buttonGrid: {
        textAlign: "right",
        [theme.breakpoints.down("sm")]: {
            textAlign: "right"
        }
    },
    button: {
        fontSize: 16,
        paddingLeft: 8
    },
    hidden: { display: "none !important" }
}));

const MyLoader = () => (
    <ContentLoader 
        height={150}
        width={700}
        speed={0.5}
        foregroundColor="#f3f3f3"
        backgroundColor="#ecebeb"
        style={{ width: "100%" }}
    >
        <rect x="-4" y="5" rx="4" ry="4" width="700" height="111" /> 
    </ContentLoader>
);

function createDateTime ({ label, value, id }, handleDateTime) {
    return (
        <KeyboardDatePicker
            required
            autoOk
            label={label}
            value={value}
            onChange={handleDateTime}
            ampm={false}
            placeholder="2010/01/01"
            format="YYYY/MM/DD"
            mask="____/__/__"
            clearable
            disableFuture
            variant="dialog"
            fullWidth
            InputProps={{
                style: { paddingRight: 0 }
            }}
        />
    );
}


// eslint-disable-next-line max-params
function prepareEOSRequest (start_ts, shift_time, setEosData) {
    const time = shift_time === "am" ? "07:30:00" : "19:30:00"; 
    const moment_start_ts = moment(start_ts).format(`YYYY-MM-DD ${time}`);
    const input = {
        shift_start: moment_start_ts
    };

    getEndOfShiftReports(input, ret => {
        setEosData(ret);
    });

    return moment_start_ts;
}

function EoSRNoData (props) {
    const { isStart } = props;
    const is_start = isStart === "undefined" ? false : isStart;
    let message = "No event report to generate";
    if (is_start) {
        message = "Generate end-of-shift reports here";
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

function EndOfShiftGenerator (props) {
    const { width, hidden } = props;
    const classes = useStyles();
    const datetime_now = moment();
    const dt_hr = datetime_now.hour();
    const [start_ts, setStartTs] = useState(datetime_now.format("YYYY-MM-DD"));
    const [shift_time, setShiftTime] = useState(dt_hr >= 10 && dt_hr <= 22 ? "am" : "pm");
    const [isLoading, setIsLoading] = useState(false);
    const [eosData, setEosData] = useState(null);
    const [selectedEosData, setSelectedEosData] = useState(null);
    const [shift_start_ts, setShiftStartTs] = useState(null);

    const [is_modal_open, setModalOpen] = useState(false);
    const set_modal_fn = bool => () => setModalOpen(bool);

    const current_user = getCurrentUser();

    const handleDateTime = value => {
        setStartTs(value);
    };

    const handleClick = key => event => {
        if (key === "generate_report") {
            setModalOpen(false);
        } else {
            setModalOpen(true);
            const ts = prepareEOSRequest(start_ts, shift_time, setEosData);
            setShiftStartTs(ts);
        }
    };

    return (
        <div className={ hidden ? classes.hidden : "" }>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid 
                    container
                    justify="space-between"
                    alignContent="center"
                    alignItems="center"
                    spacing={4}
                    style={{ display: hidden ? "none !important" : "" }}
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

                    <Grid
                        item xs={12} sm
                        className={`${classes.inputGridContainer} ${classes.buttonGrid}`}
                    >
                        <Button 
                            variant="contained"
                            color="secondary"
                            size={isWidthDown("sm", width) ? "small" : "medium"}
                            onClick={
                                handleClick("site_list")
                            }
                        >
                            Generate <ArrowForwardIos className={classes.button} />
                        </Button>
                    </Grid>
                </Grid>
            </MuiPickersUtilsProvider>

            <div className={classes.AccordionsGroup}>
                {
                    selectedEosData === null && !isLoading && (
                        <EoSRNoData isStart />
                    )
                }

                {
                    isLoading ? (
                        <MyLoader />
                    ) : (
                        <Paper>
                            {
                                selectedEosData !== null && (
                                    selectedEosData.length > 0 ? (
                                        selectedEosData.map((row, index) => (
                                            <DetailedExpansionPanels
                                                data={row}
                                                key={index}
                                                shiftStartTs={shift_start_ts}
                                                currentUser={current_user}
                                            />
                                        ))
                                    ) : (
                                        <EoSRNoData />
                                    ) 
                                )
                            }
                        </Paper>
                    )
                }
               
            </div>
            
            <SelectSiteModal
                isOpen={is_modal_open}
                closeHandler={set_modal_fn(false)}
                eosData={eosData}
                setSelectedEosData={setSelectedEosData}
                setModalOpen={setModalOpen}
                setEosData={setEosData}
            />
        </div>
    );
}

export default withWidth()(EndOfShiftGenerator);
