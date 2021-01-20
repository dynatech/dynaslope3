import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { useSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionActions from "@material-ui/core/AccordionActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import { Grid, makeStyles, Chip, Paper, CircularProgress } from "@material-ui/core";
import { Refresh, SaveAlt, Send, Info, Attachment, CheckCircle } from "@material-ui/icons";

// import CKEditor from "@ckeditor/ckeditor5-react";
// import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import CheckboxesGroup from "../../reusables/CheckboxGroup";
// import { useInterval, remapCkeditorEnterKey } from "../../../UtilityFunctions";
import { saveEOSDataAnalysis, downloadEosCharts, getNarrative } from "../ajax";
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
        matchVisual: false, // originally false
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

function DetailedAccordion (props) {
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
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    // const [narrative_editor, setNarrativeEditor] = useState(null);
    const [attachedFiles, setAttachedFiles] = useState([]);

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

    const [start_saving_countdown, setStartSavingCountdown] = useState(false);
    const [interval_id, setIntervalID] = useState(null);
    const [saving_status, setSavingStatus] = useState(null);

    useEffect(() => {
        if (start_saving_countdown) {
            if (interval_id !== null) clearTimeout(interval_id);
            setSavingStatus("typing");

            const tying_delay_id = setTimeout(() => {
                setSavingStatus("saving");
                const saving_delay_id = setTimeout(() => {
                    const temp = {
                        shift_ts: shiftStartTs,
                        event_id,
                        dataAnalysis
                    };

                    saveEOSDataAnalysis(temp, response => {
                        console.log("response", response);
                        setSavingStatus("saved");
                        setStartSavingCountdown(false);
                    });
                }, 3000);
                setIntervalID(saving_delay_id);
            }, 3000);
            setIntervalID(tying_delay_id);
        }
    }, [dataAnalysis]);

    const shift_ts_end = moment(shiftStartTs).add(12, "hours");
    const moment_validity = moment(validity);
    const ts_end = moment_validity.isBefore(shift_ts_end)
        ? moment_validity.subtract(30, "minutes").format("YYYY-MM-DD HH:mm:ss")
        : moment(shift_ts_end).format("YYYY-MM-DD HH:mm:ss");

    const { location: { host, protocol } } = window;
    const rendering_url = `${protocol}//${host}/chart_rendering/${site_code}/${ts_end}`;
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
        const loading_snackbar = enqueueSnackbar(
            "Sending End-of-Shift Report...",
            {
                variant: "warning",
                persist: true
            }
        );

        const form_data = new FormData();
        const file_name_ts = moment(ts_end).add(30, "minutes")
        .format("YYYY-MM-DD HH:mm:ss");
        const charts = extractSelectedCharts(checkboxStatus);
        charts.forEach(row => form_data.append("charts", row));

        attachedFiles.forEach(row => {       
            form_data.append("attached_files", row);
        });

        const input = {
            shift_ts: shiftStartTs,
            event_id,
            data_analysis: dataAnalysis,
            file_name_ts,
            mail_body: prepareMailBody({ shiftSummary, dataAnalysis, shiftNarratives }),
            site_code,
            user_id: currentUser.user_id,
        };

        // eslint-disable-next-line no-restricted-syntax
        for (const key in input) {
            // eslint-disable-next-line no-prototype-builtins
            if (input.hasOwnProperty(key)) form_data.append(key, input[key]);
        }

        sendEOSEmail(form_data, response=> {
            closeSnackbar(loading_snackbar);
            console.log(response);
            let message = "Error sending End-of-Shift Report...";
            let variant = "error";
            if (response === "Success") {
                message = "End-of-Shift Report Sent!";
                variant = "success";
            }

            enqueueSnackbar(
                message,
                {
                    variant,
                    autoHideDuration: 7000,
                    action: snackBarActionFn
                }
            );
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
    
    const handleFileChange = event => {
        const { files } = event.target;
        for (let i = 0; i < files.length; i += 1) {
            const temp = files.item(i);
            if (!attachedFiles.some(x => x.name === temp.name)) {
                attachedFiles.push(temp);
            }
        }
        setAttachedFiles([...attachedFiles]);
    };

    const handleRemoveFile = index => () => {
        const files = attachedFiles;
        files.splice(index, 1);
        setAttachedFiles([...files]);
    };
    
    const refreshNarratives = () => {
        const temp = {
            shift_ts: shiftStartTs,
            event_id
        };
        getNarrative(temp, site_narrative => {
            console.log(site_narrative);
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

    const is_analysis_over_limit = analysis_char_count > 3000;

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div className={classes.column}>
                    <Typography variant="body1">{site_code.toUpperCase()}</Typography>
                </div>
                <div className={classes.column}>
                    <Typography variant="body1">Shift Report</Typography>
                </div>
            </AccordionSummary>
            <Divider />
            <AccordionDetails className={classes.details}>
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

                    <Grid item xs={12} >
                        <Typography variant="body1">
                            <strong>Attachments</strong>
                        </Typography>
                    </Grid>

                    <Grid item xs={12} container>
                        <Grid item xs={12}>
                            <Paper square style={{ 
                                padding: "8px 12px", marginBottom: 12,
                                background: "gainsboro", border: "4px solid #CCCCCC"
                            }}>
                                {
                                    attachedFiles.length > 0 
                                        ? attachedFiles.map((file, index) => {
                                            return (
                                                <Chip key={file.name} label={file.name} onDelete={handleRemoveFile(index)} color="primary" />
                                            );
                                        })
                                        : <Typography variant="body2"><i>None</i></Typography>
                                }
                            </Paper>
                        </Grid>
                        <Grid item xs={12} container justify="flex-end">
                            <input
                                className={classes.input}
                                style={{ display: "none" }}
                                multiple
                                type="file"
                                onChange={handleFileChange}
                                onClick={event => { event.target.value = null; }}
                                id={`input-file-${site_code}`}
                            />
                            <label htmlFor={`input-file-${site_code}`}>
                                <Button 
                                    startIcon={<Attachment />} 
                                    variant="contained"
                                    component="span"
                                    color="primary"
                                    size="small"
                                >
                                    {attachedFiles.length > 0 ? "Add more" : "Attach File"}
                                </Button>
                            </label> 
                        </Grid>
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
                                                if (interval_id !== null) {
                                                    setStartSavingCountdown(true);
                                                } else { setIntervalID(1); }
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
                                            <Typography variant="caption">
                                                <strong>Character count (including HTML): {analysis_char_count}/3000</strong>
                                            </Typography>

                                            {
                                                saving_status !== null && <Typography 
                                                    variant="caption" component="div"
                                                    style={{
                                                        marginLeft: 24, display: "flex", alignItems: "center",
                                                        color: ["typing", "saving"].includes(saving_status) ? "orange" : "green"
                                                    }}
                                                >
                                                    <div style={{ marginRight: 6 }}>
                                                        <strong>{saving_status.toUpperCase()}</strong>
                                                    </div>
                                                    {

                                                        ["typing", "saving"].includes(saving_status) ? <CircularProgress size={20}/>
                                                            : <CheckCircle />
                                                    }
                                                </Typography>  
                                            }      
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
                            value={shiftNarratives}
                            defaultValue={shiftNarratives}
                            modules={modules}
                            formats={formats}
                            bounds=".app"
                        />
                    </Grid>
                </Grid>
            </AccordionDetails>
            <Divider />
            <AccordionActions>
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
            </AccordionActions>
        </Accordion>
    );
}

export default DetailedAccordion;
