import React, { useState, Fragment } from "react";
import moment from "moment";

import { useSnackbar } from "notistack";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import { Grid, makeStyles } from "@material-ui/core";
import { Refresh, SaveAlt, Send, Info } from "@material-ui/icons";

// import CKEditor from "@ckeditor/ckeditor5-react";
// import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import CheckboxesGroup from "../../reusables/CheckboxGroup";
import { react_host } from "../../../config";
import { useInterval, remapCkeditorEnterKey } from "../../../UtilityFunctions";
import { saveEOSDataAnalysis, getEOSDetails, downloadEosCharts, getNarrative } from "../ajax";
import { sendEOSEmail } from "../../communication/mailbox/ajax";

const modules = {
    toolbar: [
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }, 
            { indent: "-1" }, { indent: "+1" }],
        ["link"],
        ["clean"]
    ],
    clipboard: {
        // toggle to add extra line breaks when pasting HTML:
        matchVisual: true, // originally false
    }
};

const formats = [
    "bold", "italic", "underline", "strike", "blockquote",
    "list", "bullet", "indent",
    "link"
];

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

function callSnackbar (enqueueSnackbar, snackBarActionFn, response) {
    if (["saved", "up to date", "updated"].includes(response)) {
        enqueueSnackbar(
            `EOS data analysis ${response}`,
            {
                variant: "success",
                autoHideDuration: 7000,
                action: snackBarActionFn
            }
        );
    } else {
        enqueueSnackbar(
            "Error saving End-of-Shift analysis...",
            {
                variant: "error",
                autoHideDuration: 7000,
                action: snackBarActionFn
            }
        );
    }    
}

function extractSelectedCharts (checkboxStatus) {
    const chart_list = Object.keys(checkboxStatus).filter(key => checkboxStatus[key] === true);
    return chart_list;
}

function prepareMailBody (mail_contents) {
    const { shiftSummary, dataAnalysis, shiftNarratives } = mail_contents;
    const f_summary = shiftSummary.replace(/<p>/g, "").replace(/<\/p>/g, "<br/>");
    const f_analysis = dataAnalysis.replace(/<p>/g, "").replace(/<\/p>/g, "<br/>");
    const f_narratives = shiftNarratives.replace(/<p>/g, "").replace(/<\/p>/g, "<br/>");
    const template = `<p>${f_summary}</p><br/><p>${f_analysis}</p><br/><p>${f_narratives}</p>`;

    return template;
}

function DetailedExpansionPanel (props) {
    const {
        data: eos_report, shiftStartTs, currentUser
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
    const [analysis_char_count, setAnalysisCharCount] = useState(data_analysis.length);
    const [shiftNarratives, setShiftNarratives] = useState(narratives);
    const [clear_interval, setClearInterval] = useState(false);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [narrative_editor, setNarrativeEditor] = useState(null);
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
        saveEOSDataAnalysis(temp, response => {
            console.log("response", response);
            // callSnackbar(enqueueSnackbar, snackBarActionFn, response);
        });
    }, 10000, clear_interval);

    const shift_ts_end = moment(shiftStartTs).add(12, "hours");
    const moment_validity = moment(validity);
    const ts_end = moment_validity.isBefore(shift_ts_end)
        ? moment_validity.subtract(30, "minutes").format("YYYY-MM-DD HH:mm:ss")
        : moment(shift_ts_end).format("YYYY-MM-DD HH:mm:ss");

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

    const snackBarActionFn = key => {
        return (<Button
            color="primary"
            onClick={() => { closeSnackbar(key); }}
        >
            Dismiss
        </Button>);
    };

    const handleSendEOS = () => {
        // Get the charts
        const file_name_ts = moment(ts_end).add(30, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");

        const temp = {
            shift_ts: shiftStartTs,
            event_id,
            dataAnalysis
        };

        const loading_snackbar = enqueueSnackbar(
            "Sending End-of-Shift Report...",
            {
                variant: "warning",
                persist: true
            }
        );

        saveEOSDataAnalysis(temp, save_response => {
            console.log("save_response", save_response);
            // callSnackbar(enqueueSnackbar, snackBarActionFn, save_response);

            getEOSDetails(event_id, file_name_ts, eos_details => {
                const { subject, file_name, recipients } = eos_details;
    
                const charts = extractSelectedCharts(checkboxStatus);
    
                const input = {
                    mail_body: prepareMailBody({ shiftSummary, dataAnalysis, shiftNarratives }),
                    subject,
                    recipients,
                    file_name,
                    site_code,
                    user_id: currentUser.user_id,
                    charts
                };
        
                sendEOSEmail(input, response => {
                    closeSnackbar(loading_snackbar);
                    console.log(response);
                    if (response === "Success") {
                        enqueueSnackbar(
                            "End-of-Shift Report Sent!",
                            {
                                variant: "success",
                                autoHideDuration: 7000,
                                action: snackBarActionFn
                            }
                        );
                    } else {
                        enqueueSnackbar(
                            "Error sending End-of-Shift Report...",
                            {
                                variant: "error",
                                autoHideDuration: 7000,
                                action: snackBarActionFn
                            }
                        );
                    }
                }, () => {
                    closeSnackbar(loading_snackbar); 
                    enqueueSnackbar(
                        "Error sending End-of-Shift Report...",
                        {
                            variant: "error",
                            autoHideDuration: 7000,
                            action: snackBarActionFn
                        }
                    );
                });
        
                setClearInterval(true);
            });
        });
    };

    const handleDownload = () => {
        const charts = extractSelectedCharts(checkboxStatus);
        const input = {
            site_code, user_id: currentUser.user_id, charts, file_name: `${site_code}_chart.pdf`
        };
        downloadEosCharts(input, response => {
            const { message, file_response: { file_path, message: render_msg } } = response;
            console.log("response", render_msg);
            if (message === "success") {
                enqueueSnackbar(
                    `Charts Saved! Path: ${file_path}`,
                    {
                        variant: "success",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            } else {
                enqueueSnackbar(
                    "Error saving charts...",
                    {
                        variant: "error",
                        autoHideDuration: 7000,
                        action: snackBarActionFn
                    }
                );
            }
        });
    };

    const refreshNarratives = () => {
        const temp = {
            shift_ts: shiftStartTs,
            event_id
        };
        getNarrative(temp, site_narrative => {
            setShiftNarratives(site_narrative);
            // narrative_editor.setData(site_narrative);
        });
    };

    // const config = {
    //     toolbar: ["bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "|", "undo", "redo"]
    // };

    const editors = [
        { 
            label: "Shift Summary", value: shiftSummary,
            key: "shift_summary", updateFn: setShiftSummary
        },
        { 
            label: "Data Analysis", value: dataAnalysis,
            key: "data_analysis", updateFn: setDataAnalysis
        }
    ];

    const is_analysis_over_limit = analysis_char_count > 1500;

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
                                    {/* <CKEditor
                                        editor={ClassicEditor}
                                        config={config}
                                        onInit={editor => {
                                            editor.setData(value);
                                            remapCkeditorEnterKey(editor);
                                        }}
                                        onChange={(event, editor) => {
                                            const data = editor.getData();
                                            if (label === "Data Analysis") {
                                                setAnalysisCharCount(data.length);
                                            }
                                            updateFn(data);
                                        }}
                                    /> */}
                                    <ReactQuill 
                                        onChange={e => {
                                            if (label === "Data Analysis") {
                                                setAnalysisCharCount(e.length);
                                            }
                                            updateFn(e);
                                        }}
                                        defaultValue={value}
                                        modules={modules}
                                        formats={formats}
                                    />
                                </Grid>
                                {
                                    label === "Data Analysis" && (
                                        <Grid 
                                            container item xs={12}
                                            justify="flex-end" alignItems="center"
                                            style={{ color: is_analysis_over_limit ? "red" : "black" }}
                                        >
                                            <Tooltip 
                                                title="Content of text area is formatted on the background using HTML. HTML elements are included in the character count."
                                                placement="top"
                                                interactive
                                                arrow
                                            >
                                                <div><Info color="primary" fontSize="small"/>&nbsp;</div>
                                            </Tooltip>
                                            <Typography variant="caption" >
                                                <strong>Character count (including HTML): {analysis_char_count}/1500</strong>
                                            </Typography>        
                                        </Grid>
                                    )
                                }
                            </Fragment>
                        ))

                    }
                    <Grid item xs={12}>
                        <Typography variant="body1">
                            <strong>Shift Narratives </strong>
                        </Typography>
                        <Typography variant="body2">
                            <i>NOTE: It is recommended NOT to add narratives via this text box. Use Site Logs Form instead then click Refresh.</i>
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        {/* <CKEditor
                            editor={ClassicEditor}
                            config={config}
                            onInit={editor => {
                                editor.setData(shiftNarratives);
                                setNarrativeEditor(editor);
                                // editor.destroy();
                            }}
                            onChange={(event, editor) => {
                                const data = editor.getData();
                                setShiftNarratives(data);
                            }}
                        />  */}
                        <ReactQuill 
                            onChange={e => setShiftNarratives(e)}
                            defaultValue={shiftNarratives}
                            modules={modules}
                            formats={formats}
                            bounds=".app"
                        />
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider />
            <ExpansionPanelActions>
                <Button
                    size="small"
                    onClick={handleDownload}
                    startIcon={<SaveAlt />}
                >
                    Download Charts
                </Button>
                <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={refreshNarratives}
                >
                    Refresh Narratives
                </Button>
                <Button
                    size="small"
                    color="primary"
                    startIcon={<Send />}
                    onClick={handleSendEOS}
                    disabled={is_analysis_over_limit}
                >
                    Send
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}

export default DetailedExpansionPanel;
