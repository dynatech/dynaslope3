import React from "react";

import {
    Grid, Typography, Card,
    CardContent, Button, CardActions,
    TextField
} from "@material-ui/core";

import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";

import moment from "moment";

function RainSection (props) {
    const { rainGauge } = props;
    const { date_activated, date_deactivated } = rainGauge;

    const deact = date_deactivated ? moment(date_deactivated).format("DD MMMM YYYY") : "---";

    return <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
        <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
            <strong>RAIN GAUGE</strong>
        </Typography>

        <Typography component={Grid}
            item xs={12} md={6}
            variant="body1" align="center"
        >
            <strong>Date activated:</strong> {moment(date_activated).format("DD MMMM YYYY")}
        </Typography>

        <Typography component={Grid}
            item xs={12} md={6}
            variant="body1" align="center"
        >
            <strong>Date deactivated:</strong> {deact}
        </Typography>
    </CardContent></Card>;
}

function TiltSection (props) {
    const { tsmSensor } = props;
    const {
        date_activated, date_deactivated, version,
        number_of_segments, segment_length
    } = tsmSensor;

    const deact = date_deactivated ? moment(date_deactivated).format("DD MMMM YYYY") : "---";

    return <Card variant="outlined"><CardContent component={Grid} container spacing={2}>
        <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
            <strong>TILT SENSOR</strong>
        </Typography>

        <Typography component={Grid}
            item xs={12} sm={12} md={4}
            variant="body1" align="center"
        >
            <strong>Version:</strong> {version}
        </Typography>

        <Typography component={Grid}
            item xs={12} sm={6} md={4}
            variant="body1" align="center"
        >
            <strong>No. of segments:</strong> {number_of_segments}
        </Typography>

        <Typography component={Grid}
            item xs={12} sm={6} md={4}
            variant="body1" align="center"
        >
            <strong>Segment length:</strong> {segment_length}
        </Typography>

        <Typography component={Grid}
            item xs={12} md={6}
            variant="body1" align="center"
        >
            <strong>Date activated:</strong> {moment(date_activated).format("DD MMMM YYYY")}
        </Typography>

        <Typography component={Grid}
            item xs={12} md={6}
            variant="body1" align="center"
        >
            <strong>Date deactivated:</strong> {deact}
        </Typography>
    </CardContent></Card>;
}

function MainSection (props) {
    const { selectedLogger } = props;
    const {
        date_activated, date_deactivated, latitude,
        longitude, logger_mobile: { sim_num },
        logger_model: { logger_type }
    } = selectedLogger;

    const deact = date_deactivated ? moment(date_deactivated).format("DD MMMM YYYY") : "---";

    return (
        <Card variant="outlined">
            <CardContent component={Grid} container spacing={2}>
                <Typography variant="subtitle1" display="block" component={Grid} item xs={12}>
                    <strong>LOGGER INFO</strong>
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Date installed:</strong> {moment(date_activated).format("DD MMMM YYYY")}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Date deactivated:</strong> {deact}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Type:</strong> {logger_type.toUpperCase()}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Logger number:</strong> +{sim_num}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Latitude:</strong> {latitude}
                </Typography>

                <Typography component={Grid}
                    item xs={12} sm={6} lg={4}
                    variant="body1" align="center"
                >
                    <strong>Longitude:</strong> {longitude}
                </Typography>

                {/* <MuiPickersUtilsProvider utils={MomentUtils}>
                    <Grid item xs={6} lg={3}>
                        <KeyboardDatePicker
                            autoOk
                            label="Date Deactivated"
                            // value={deployment_data.rain.date_activated.value || null}
                            // onChange={e => dispatch({ type: "UPDATE_SENSOR", field: "date_activated", value: { data: e, sensor: "rain" } })}
                            // helperText={deployment_data.rain.date_activated.helper_text || ""}
                            // error={Boolean(deployment_data.rain.date_activated.helper_text)}
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

                <Grid item xs={6} lg={3}>
                    <TextField
                        required
                        fullWidth
                        label="Logger Number"
                        // InputProps={{
                        //     inputComponent: TextMaskCustom,
                        //     inputProps: { mask: logger_number_mask }
                        // }}
                        InputLabelProps={{ shrink: true }}
                        // value={deployment_data.logger_number.value}
                        // onChange={e => dispatch({ type: "UPDATE", field: "logger_number", value: e.target.value })}
                        // helperText={deployment_data.logger_number.helper_text || ""}
                        // error={Boolean(deployment_data.logger_number.helper_text)}
                    />
                </Grid>

                <Grid item xs={6} lg={3}>
                    <TextField
                        fullWidth
                        required
                        label="Latitude"
                        type="number"
                    //     value={deployment_data.latitude.value}
                    //     onChange={e => dispatch({ type: "UPDATE", field: "latitude", value: e.target.value })}
                    //     helperText={deployment_data.latitude.helper_text || ""}
                    //     error={Boolean(deployment_data.latitude.helper_text)}
                    />
                </Grid>

                <Grid item xs={6} lg={3}>
                    <TextField
                        fullWidth
                        required
                        label="Longitude"
                        type="number"
                        // value={deployment_data.longitude.value}
                        // onChange={e => dispatch({ type: "UPDATE", field: "longitude", value: e.target.value })}
                        // helperText={deployment_data.longitude.helper_text || ""}
                        // error={Boolean(deployment_data.longitude.helper_text)}
                    />
                </Grid> */}
            </CardContent>
        
            <CardActions style={{ justifyContent: "flex-end" }}>
                <Button color="primary">Edit</Button>
            </CardActions>
        </Card>
    );
}

function LoggerDetails (props) {
    const { selectedLogger } = props;
    const {
        logger_name, logger_model: {
            has_rain, has_tilt,
            has_soms, has_piezo
        }, tsm_sensor, rain_gauge, piezo, soms
    } = selectedLogger;

    return (
        <Grid container spacing={2} justify="space-evenly">
            <Typography
                component={Grid}
                item xs={12}
                variant="h6"
            >
                <strong>{logger_name.toUpperCase()}</strong>
            </Typography>

            <Grid item xs={12}>
                <MainSection selectedLogger={selectedLogger} />
            </Grid>

            {
                has_rain === 1 && Boolean(rain_gauge) && 
                    <Grid item xs={12}><RainSection rainGauge={rain_gauge} /></Grid>
            }

            {
                has_tilt === 1 && Boolean(tsm_sensor) &&
                    <Grid item xs={12}><TiltSection tsmSensor={tsm_sensor} /></Grid>
            }
        </Grid>
    );
}

export default LoggerDetails;