import React, { Component, Fragment } from "react";
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
import withWidth, { isWidthUp, isWidthDown } from "@material-ui/core/withWidth";
import { compose } from "recompose";
import { Refresh, SaveAlt, Send } from "@material-ui/icons";

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
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline",
        },
    },
});

class DetailedExpansionPanel extends Component {
    state = {
        shift_summary: "",
        data_analysis: "",
        shift_narratives: ""
    }

    showTextLabel = (label, width) => (
        isWidthUp("sm", width) ? <span style={{ paddingLeft: 6 }}>{label}</span> : ""
    )

    changeState = (key, value) => {
        this.setState({ [key]: value });
    };

    handleEventChange = key => event => {
        const { value } = event.target;
        this.changeState(key, value);
    }

    render () {
        const { classes, width } = this.props;
        const { shift_summary, data_analysis, shift_narratives } = this.state;

        return (
            <Fragment>
                <ExpansionPanel>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                        <div className={classes.column}>
                            <Typography className={classes.heading}>AGB</Typography>
                        </div>
                        <div className={classes.column}>
                            <Typography className={classes.secondaryHeading}>Shift Report</Typography>
                        </div>
                    </ExpansionPanelSummary>
                    <Divider />
                    <ExpansionPanelDetails className={classes.details}>
                        <Grid container>
                            {
                                [
                                    { label: "Shift Summary", value: shift_summary, key: "shift_summary" },
                                    { label: "Data Analysis", value: data_analysis, key: "data_analysis" },
                                    { label: "Shift Narratives", value: shift_narratives, key: "shift_narratives" }
                                ].map(({ label, value, key }) => (
                                    <Grid item xs={12} key={key}>
                                        <TextField
                                            label={label}
                                            multiline
                                            rowsMax="4"
                                            placeholder={`Enter ${label.toLowerCase()} details`}
                                            value={value}
                                            onChange={this.handleEventChange(key)}
                                            margin="normal"
                                            variant="outlined"
                                            fullWidth
                                        />
                                    </Grid>
                                ))
                            }
                        </Grid>
                    </ExpansionPanelDetails>
                    <Divider />
                    <ExpansionPanelActions>
                        <Button size="small">
                            <SaveAlt className={classes.icons} /> {this.showTextLabel("Download Charts", width)}
                        </Button>
                        <Button size="small">
                            <Refresh className={classes.icons} /> {this.showTextLabel("Refresh", width)}
                        </Button>
                        <Button size="small" color="primary">
                            <Send className={classes.icons} /> {this.showTextLabel("Send", width)}
                        </Button>
                    </ExpansionPanelActions>
                </ExpansionPanel>
            </Fragment>
        );
    }
}

DetailedExpansionPanel.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default compose(withWidth(), withStyles(styles))(DetailedExpansionPanel);