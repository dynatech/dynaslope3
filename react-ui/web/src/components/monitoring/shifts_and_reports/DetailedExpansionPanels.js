import React, { Component, Fragment, useState, useEffect } from "react";
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
import { TextField, Grid } from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { compose } from "recompose";
import { Refresh, SaveAlt, Send, FreeBreakfastOutlined } from "@material-ui/icons";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CheckboxesGroup from "../../reusables/CheckboxGroup";

const styles = theme => ({
    root: {
        width: "100%",
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
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
            console.log("BOOM! Opens rainfall chart...");
            break;
        case "surficial":
            setCheckboxStatus({ ...checkboxStatus, surficial: !checkboxStatus.surficial });
            console.log("BOOM! Opens surficial chart...");
            break;
        case "subsurface":
            setCheckboxStatus({ ...checkboxStatus, subsurface: !checkboxStatus.subsurface });
            console.log("BOOM! Opens a multiselect...");
            break;
        default:
            console.log("DEF!");
            break;
    }
}


function DetailedExpansionPanel (props) {
    const { data: eos_report, classes, width } = props;
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
    }, []);

    const showTextLabel = (label, width) => (
        isWidthUp("sm", width) ? <span style={{ paddingLeft: 6 }}>{label}</span> : ""
    );

    const changeState = (key, value) => {
        const dictionary = {
            shift_summary: setShiftSummary,
            data_analysis: setDataAnalysis,
            shift_narratives: setShiftNarratives
        };
        dictionary[key](value);
    };

    const handleEventChange = key => event => {
        const { value } = event.target;
        changeState(key, value);
    };

    const handleCheckboxEvent = value => event => handleCheckboxToggle(value, checkboxStatus, setCheckboxStatus);

    return (
        <Fragment>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <div className={classes.column}>
                        <Typography className={classes.heading}>{siteCode.toUpperCase()}</Typography>
                    </div>
                    <div className={classes.column}>
                        <Typography className={classes.secondaryHeading}>Shift Report</Typography>
                    </div>
                </ExpansionPanelSummary>
                <Divider />
                <ExpansionPanelDetails className={classes.details}>
                    <Grid container>
                        <Grid item xs={12}>
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
                                <Grid item xs={12} key={key}>
                                    <Typography variant="h6" className={classes.heading}>
                                        {label}
                                    </Typography>
                                    <CKEditor
                                        editor={ ClassicEditor }
                                        // data="<strong>END-OF-SHIFT REPORT (AJ,             KG)</strong> <br /><br /><b>SHIFT START:<br/>            January 12, 2019, 07:30 AM</b> <br />- Monitoring continued with the following recent trigger/s: <ul><li> Rainfall - alerted on                     January 12, 2019, 03:30 AM due to accumulated rainfall value exceeding threshold level (RAIN NOAH 1457: 1-day cumulative rainfall (60.00 mm) exceeded threshold (58.10 mm))</li><li> Rainfall - alerted on                     January 11, 2019, 11:30 PM due to accumulated rainfall value exceeding threshold level (RAIN NOAH 1457: 1-day cumulative rainfall (60.50 mm) exceeded threshold (58.10 mm))</li><li> Rainfall - alerted on                     January 11, 2019, 08:00 PM due to accumulated rainfall value exceeding threshold level (RAIN NOAH 1457: 1-day cumulative rainfall (58.50 mm) exceeded threshold (58.10 mm))</li></ul>- Event monitoring started on January 11, 2019, 08:00 PM due toaccumulated rainfall value exceeding threshold level (RAIN NOAH 1457: 1-day cumulative rainfall (58.50 mm) exceeded threshold (58.10 mm)).<br /><b>SHIFT END:<br/>January 12, 2019, 08:30 PM</b><br />- Alert <b>lowered to A0</b>; monitoring ended at <b>             2019-01-13 12:00:00</b>.<br/>"
                                        data="<p>Hi! Starting entering data</p>"
                                        onInit={ editor => {
                                        // You can store the "editor" and use when it is needed.
                                            editor.setData(value);
                                        } }
                                        onChange={ ( event, editor ) => {
                                            const data = editor.getData();

                                            console.log( { event, editor, data } );
                                        } }
                                        onBlur={ ( event, editor ) => {
                                            console.log( "Blur.", editor );
                                        } }
                                        onFocus={ ( event, editor ) => {
                                            console.log( "Focus.", editor );
                                        } }
                                    />                                    
                                </Grid>
                            )
                            )
                        }
                    </Grid>
                </ExpansionPanelDetails>
                <Divider />
                <ExpansionPanelActions>
                    <Button size="small">
                        <SaveAlt className={classes.icons} /> {showTextLabel("Download Charts", width)}
                    </Button>
                    <Button size="small">
                        <Refresh className={classes.icons} /> {showTextLabel("Refresh", width)}
                    </Button>
                    <Button size="small" color="primary">
                        <Send className={classes.icons} /> {showTextLabel("Send", width)}
                    </Button>
                </ExpansionPanelActions>
            </ExpansionPanel>
        </Fragment>
    );
}


DetailedExpansionPanel.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default compose(withWidth(), withStyles(styles))(DetailedExpansionPanel);