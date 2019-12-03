import React, { useState, useEffect, Fragment } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";
import { Refresh, SaveAlt, Send } from "@material-ui/icons";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CheckboxesGroup from "../../reusables/CheckboxGroup";
import { react_host } from "../../../config";

const styles = theme => ({
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
});

function handleCheckboxToggle (value, checkboxStatus, setCheckboxStatus) {
    switch (value) {
        case "rainfall":
            setCheckboxStatus({ ...checkboxStatus, rainfall: !checkboxStatus.rainfall });
            break;
        case "surficial":
            setCheckboxStatus({ ...checkboxStatus, surficial: !checkboxStatus.surficial });
            break;
        case "subsurface":
            setCheckboxStatus({ ...checkboxStatus, subsurface: !checkboxStatus.subsurface });
            break;
        default:
            break;
    }
}

function DetailedExpansionPanel (props) {
    const { data: eos_report, classes } = props;
    const [siteCode, setSiteCode] = useState("");
    const [shiftSummary, setShiftSummary] = useState("");
    const [dataAnalysis, setDataAnalysis] = useState("");
    const [shiftNarratives, setShiftNarratives] = useState("");

    const [checkboxStatus, setCheckboxStatus] = useState({
        rainfall: false, surficial: false, subsurface: false
    });

    const choices = [
        { state: checkboxStatus.rainfall, value: "rainfall", label: "Rainfall" },
        { state: checkboxStatus.surficial, value: "surficial", label: "Surficial" },
        { state: checkboxStatus.subsurface, value: "subsurface", label: "Subsurface" }
    ];

    useEffect(() => {
        const {
            site_code, eos_head, shift_start_info,
            shift_end_info, data_analysis, narratives 
        } = eos_report;

        setSiteCode(site_code);
        const node_shift_summary = `${eos_head}<br />${shift_start_info}<br /><br />${shift_end_info}`;
        setShiftSummary(node_shift_summary);
        setDataAnalysis(data_analysis);
        setShiftNarratives(narratives);
    }, [eos_report]);

    useEffect(() => {
        if (checkboxStatus.rainfall) {
            window.open(`${react_host}/chart_rendering/${siteCode}/rainfall`, "_blank");
        }
    }, [checkboxStatus.rainfall]);

    const handleCheckboxEvent = value => event => handleCheckboxToggle(value, checkboxStatus, setCheckboxStatus);

    const config = {
        toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "|", "undo", "redo"]
    };

    return (
        <ExpansionPanel>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <div className={classes.column}>
                    <Typography variant="body1">{siteCode.toUpperCase()}</Typography>
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
                        [
                            { label: "Shift Summary", value: shiftSummary, key: "shift_summary" },
                            { label: "Data Analysis", value: dataAnalysis, key: "data_analysis" },
                            { label: "Shift Narratives", value: shiftNarratives, key: "shift_narratives" }
                        ].map(({ label, value, key }) => (
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
                                        // You can store the "editor" and use when it is needed.
                                            editor.setData(value);
                                        // console.log(Array.from(editor.ui.componentFactory.names()));
                                        }}
                                    // onChange={(event, editor) => {
                                    //     const data = editor.getData();
                                    //     console.log({ event, editor, data });
                                    // }}
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
                <Button size="small" color="primary" startIcon={<Send />}>
                    Send
                </Button>
            </ExpansionPanelActions>
        </ExpansionPanel>
    );
}


DetailedExpansionPanel.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DetailedExpansionPanel);