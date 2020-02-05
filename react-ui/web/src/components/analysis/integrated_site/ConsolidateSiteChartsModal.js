import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions,
    Button, withMobileDialog, Grid,
    makeStyles, FormControl, FormLabel,
    FormControlLabel, FormGroup, Checkbox,
    Divider, Typography
} from "@material-ui/core";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import { Link } from "react-router-dom";
import DynaslopeSiteSelectInputForm from "../../reusables/DynaslopeSiteSelectInputForm";
import { SlideTransition, FadeTransition } from "../../reusables/TransitionList";
import { getSiteSubsurfaceColumns } from "../ajax";

const useStyles = makeStyles(theme => ({
    link: { textDecoration: "none" }
}));

function ConsolidatedSiteChartsModal (props) {
    const {
        fullScreen, isOpen,
        clickHandler, isMobile,
        url
    } = props;
    const classes = useStyles();
    const [site_value, setSiteValue] = useState({ value: null, data: { site_code: null } });
    const update_site_value = value => setSiteValue(value);
    const [ts_end, setTsEnd] = useState(moment());
    const update_ts_end = value => setTsEnd(value);

    const [chart_cboxes, setChartCboxes] = useState({
        rainfall: true, surficial: true, subsurface: {}
    });
    const [subsurface_cols, setSubsurfaceCols] = useState([]);
    const set_cboxes = (key, sub = null) => event => {
        const { target: { checked } } = event;
        let update = checked;

        if (sub !== null) {
            const { subsurface: temp } = chart_cboxes;
            temp[sub] = checked;
            update = temp;
        }

        setChartCboxes({
            ...chart_cboxes, [key]: update
        });
    };

    useEffect(() => {
        return (() => {
            setTsEnd(moment());
        });
    }, [isOpen]);

    useEffect(() => {
        const { data: { site_code } } = site_value;
        if (site_code !== null) {
            getSiteSubsurfaceColumns(site_code, data => {
                setSubsurfaceCols([]);
                const sub = {};
                data.forEach(s => {
                    const is_checked = s.date_deactivated === null;
                    sub[s.logger.logger_name] = is_checked;
                });
                setChartCboxes({ ...chart_cboxes, subsurface: sub });
                setSubsurfaceCols(data);
            });   
        }
    }, [site_value.data.site_code]);

    const { data: site } = site_value;
    const subsurface_columns = [];
    Object.keys(chart_cboxes.subsurface).forEach(key => {
        if (chart_cboxes.subsurface[key]) subsurface_columns.push(key);
    });

    return (
        <Dialog
            fullWidth
            fullScreen={fullScreen}
            open={isOpen}
            aria-labelledby="form-dialog-title"
            TransitionComponent={fullScreen ? SlideTransition : FadeTransition}      
        >
            <DialogTitle id="form-dialog-title">
                Consolidate charts per site
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill in the following.
                </DialogContentText>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DynaslopeSiteSelectInputForm
                            value={site_value}
                            changeHandler={update_site_value}
                        />
                    </Grid>

                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Grid item xs={12}>
                            <KeyboardDateTimePicker
                                required
                                autoOk
                                label="Data Timestamp"
                                value={ts_end}
                                onChange={update_ts_end}
                                ampm={false}
                                placeholder="2010/01/01 00:00"
                                format="YYYY/MM/DD HH:mm"
                                mask="__/__/____ __:__"
                                clearable
                                disableFuture
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>
                </Grid>

                <Grid item xs={12} style={{ marginTop: 18 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Charts to Show</FormLabel>
                        <FormGroup aria-label="position" row>
                            <FormControlLabel
                                value="rainfall"
                                control={<Checkbox
                                    color="primary"
                                    onClick={set_cboxes("rainfall")}
                                    checked={chart_cboxes.rainfall}
                                />}
                                label="Rainfall"
                            />
                            <FormControlLabel
                                value="surficial"
                                control={<Checkbox
                                    color="primary"
                                    onClick={set_cboxes("surficial")}
                                    checked={chart_cboxes.surficial}
                                />}
                                label="Surficial"
                            />
                        </FormGroup>
                    </FormControl>
                </Grid>

                <Grid item xs={12} style={{ marginTop: 8 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Subsurface Columns</FormLabel>
                        <FormGroup aria-label="position" row>
                            {
                                subsurface_cols.map(row => {
                                    const { date_deactivated, logger: { logger_name } } = row;
                                    const deactivated = date_deactivated === null ? "" : " (Deactivated)";

                                    return (
                                        <FormControlLabel
                                            key={logger_name}
                                            value={logger_name}
                                            control={<Checkbox
                                                color="primary"
                                                onClick={set_cboxes("subsurface", logger_name)}
                                                checked={chart_cboxes.subsurface[logger_name]}
                                            />}
                                            label={logger_name.toUpperCase() + deactivated}
                                        />
                                    );
                                })
                            }

                            {
                                subsurface_cols.length === 0 && (
                                    <Typography variant="body1">No site selected</Typography>
                                )
                            }
                        </FormGroup>
                    </FormControl>
                </Grid>
                
                {
                    !isMobile && <div style={{ height: 120 }} />
                }
            </DialogContent>
            <DialogActions>
                <Button 
                    component={Link}
                    to={{
                        pathname: `${url}/consolidated/${site.site_code}`,
                        ts_end,
                        site,
                        to_include: chart_cboxes,
                        subsurface_columns
                    }}
                    color="primary"
                    onClick={clickHandler}
                    disabled={site_value.length === 0}
                >
                    Submit
                </Button>
                <Button onClick={clickHandler}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withMobileDialog()(ConsolidatedSiteChartsModal);
