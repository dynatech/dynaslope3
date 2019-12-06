import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { Grid, makeStyles } from "@material-ui/core";
import { Refresh, SaveAlt, Send } from "@material-ui/icons";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CheckboxesGroup from "../../reusables/CheckboxGroup";
import { react_host } from "../../../config";
import { useInterval } from "../../../UtilityFunctions";
import { saveEOSDataAnalysis } from "../ajax";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
    },
    icons: {
        fontSize: "1.15rem",
        [theme.breakpoints.down("xs")]: {
            fontSize: "1.7rem"
        }
    },
    details: {
        alignItems: "center",
    },
    column: {
        flexBasis: "33.33%",
    },
    helper: {
        borderLeft: `2px solid ${theme.palette.divider}`,
        padding: `${theme.spacing()}px ${theme.spacing(2)}px`,
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline",
        },
    },
}));

function DetailedExpansionPanel (props) {
    const {
        data: eos_report, shiftStartTs
    } = props;
    const classes = useStyles();
    const {
        site_code, eos_head, shift_start_info,
        shift_end_info, data_analysis, narratives,
        event_id, validity
    } = eos_report;

    const node_shift_summary = `${eos_head}<br/>${shift_start_info}<br/><br/>${shift_end_info}`;
    const [shiftSummary, setShiftSummary] = useState(node_shift_summary);
    const [dataAnalysis, setDataAnalysis] = useState(data_analysis);
    const [shiftNarratives, setShiftNarratives] = useState(narratives);
    const [clear_interval, setClearInterval] = useState(false);

    const default_cbox = {
        rainfall: false, surficial: false
    };
    const default_label = [["rainfall", "Rainfall", false]];
    const { has_markers, has_surficial_data, subsurface_columns } = eos_report;

    let surf_label = "Surficial";
    let surf_dis = false;
    if (has_markers) {
        if (!has_surficial_data) {
            surf_label += " (No data)";
            surf_dis = true;
        }
    } else {
        surf_label += " (No markers)";
        surf_dis = true;
    }
    default_label.push(["surficial", surf_label, surf_dis]);

    subsurface_columns.forEach(row => {
        const { logger: { logger_name } } = row;
        const key = `subsurface_${logger_name}`;
        let label = `Subsurface - ${logger_name.toUpperCase()}`;
        default_cbox[key] = false;
        const no_data = !row.has_data;
        if (no_data) {
            label += " (No data)";
        }
        default_label.push([key, label, no_data]);
    });

    const [checkboxStatus, setCheckboxStatus] = useState(default_cbox);

    const choices = default_label.map(row => {
        return { 
            state: checkboxStatus[row[0]],
            value: row[0],
            label: row[1],
            is_disabled: row[2]
        };
    });

    useInterval(() => {
        const temp = {
            shift_ts: shiftStartTs,
            event_id,
            dataAnalysis
        };
        // saveEOSDataAnalysis();
    }, 10000, clear_interval);

    const shift_ts_end = moment(shiftStartTs).add(12, "hours");
    const ts_end = moment(validity).isBefore(shift_ts_end) ?
        validity : moment(shift_ts_end).format("YYYY-MM-DD HH:mm:ss");

    const rendering_url = `${react_host}/chart_rendering/${site_code}/${ts_end}`;
    const handleCheckboxEvent = value => event => {
        const { target: { checked } } = event;
        setCheckboxStatus({ ...checkboxStatus, [value]: checked });

        if (checked) {
            let type = value;
            if (!["surficial", "rainfall"].includes(value)) {
                type = value.replace("_", "/");              
            }
            window.open(`${rendering_url}/${type}`, "_blank");
        }
    };

    const config = {
        toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "|", "undo", "redo"]
    };

    const editors = [
        { 
            label: "Shift Summary", value: shiftSummary,
            key: "shift_summary", updateFn: setShiftSummary
        },
        { 
            label: "Data Analysis", value: dataAnalysis,
            key: "data_analysis", updateFn: setDataAnalysis
        },
        {
            label: "Shift Narratives", value: shiftNarratives,
            key: "shift_narratives", updateFn: setShiftNarratives
        }
    ];

    return (
        <ExpansionPanel>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <div className={classes.column}>
                    <Typography variant="body1">{site_code.toUpperCase()}</Typography>
                </div>
                <div className={classes.column}>
                    <Typography variant="body1">Shift Report</Typography>
                </div>
            </ExpansionPanelSummary>
            <Divider />
            <ExpansionPanelDetails className={classes.details}>
                <Grid container spacing={2}>
                    <Grid item xs={12} style={{ marginTop: 12 }}>
                        <Typography variant="body1">
                            <strong>Charts</strong>
                        </Typography>
                    </Grid>
                    <Grid 
                        item xs={12} container
                        spacing={1} justify="space-around"
                    >
                        <CheckboxesGroup 
                            label="Data Sources"
                            changeHandler={handleCheckboxEvent}
                            choices={choices}
                            checkboxStyle="primary"
                        />
                    </Grid>
                    {   
                        editors.map(({ label, value, key, updateFn }) => (
                            <Fragment key={key}>
                                <Grid item xs={12}>
                                    <Typography variant="body1">
                                        <strong>{label}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    { /* 
                                        NOTE: To change textarea height of CKEditor, change .ck-editor__editable 
                                        value on index.css on react-ui/web
                                    */ }
                                    <CKEditor
                                        editor={ClassicEditor}
                                        config={config}
                                        onInit={editor => {
                                            editor.setData(value);
                                        }}
                                        onChange={(event, editor) => {
                                            const data = editor.getData();
                                            updateFn(data);
                                        }}
                                    />                                    
                                </Grid>
                            </Fragment>
                        ))
                    }
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button size="small" startIcon={<SaveAlt />}>
                    Download Charts
                </Button>
                <Button size="small" startIcon={<Refresh />}>
                    Refresh
                </Button>
                <Button
                    size="small"
                    color="primary"
                    startIcon={<Send />}
                    onClick={() => { console.log(checkboxStatus); setClearInterval(true); }}
                >
                    Send
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

export default DetailedExpansionPanel;