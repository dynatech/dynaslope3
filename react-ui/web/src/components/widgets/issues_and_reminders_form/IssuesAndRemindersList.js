import React, { useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";
import moment from "moment";
import {
    withMobileDialog, Typography, GridList, 
    GridListTile, GridListTileBar, 
    IconButton, Button, Grid
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { compose } from "recompose";

import IssuesAndReminderModal from "./IssuesAndReminderModal";
import { getIssuesAndReminders } from "./ajax";


const styles = theme => ({
    inputGridContainer: {
        marginTop: 8,
        marginBottom: 8
    },
    selectInput: {
        width: "auto",
        [theme.breakpoints.down("xs")]: {
            width: "250px"
        }
    },
    root: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: maxWidth,
        height: 500,
        color: "rgba(1, 1, 1, 1)",
    },
    icon: {
        color: "rgba(255, 255, 255, 0.54)",
    },
    preview_text: {
        padding: "12px",
        fontSize: "14px"
    },
    tile_project_tile: {
        backgroundColor: "#8EFF8C"
    },
    tile_site_tile: {
        backgroundColor: "#E66060"
    },
    tile_event_tile: {
        backgroundColor: "#FFCB57"
    }    
});


function prepareTileData (classes, processed_i_n_r, handleEdit) {
    return processed_i_n_r.map((tile, index) => {
        const { site_events_list, site_list, detail, issue_reporter, title } = tile;
        let item_title = "";
        let tile_class;
        if (site_list.length === 0) {
            item_title = "Project-Wide";
            tile_class = classes.tile_project_tile;
        } else {
            item_title = site_list.join(" | ");
            tile_class = classes.tile_event_tile;
            if (site_events_list.length > 0) tile_class = classes.tile_site_tile;
        }

        return (
            <GridListTile key={`test ${index + 1}`} cols={2} className={tile_class}>
                <Typography
                    className={classes.preview_text}
                >{detail}</Typography>
                <GridListTileBar
                    title={item_title}
                    subtitle={`${issue_reporter.first_name} ${issue_reporter.last_name}`}
                    // subtitle="This is subtitle"
                    actionIcon={
                        <IconButton 
                            aria-label={`info about ${title}`}
                            className={classes.icon}
                            // onClick={handleBoolean("is_issue_reminder_modal_open", true)}
                            onClick={handleEdit(tile)}
                        >
                            <InfoIcon />
                        </IconButton>
                    }
                />
            </GridListTile>
        );
    });
}


function includeSiteList (issues_and_reminders) {
    const processed_i_n_r = issues_and_reminders.map((iar, index) => {
        const site_id_list = [];
        const site_list = [];
        const site_events_list = [];
        iar.postings.forEach(element => {
            const { event_id, site_id, site } = element;
            if (site_id !== null) {
                site_id_list.push(site_id);
                site_list.push(site.site_code.toUpperCase());
                site_events_list.push(event_id);
            }
        });

        const is_event_entry = site_events_list.length !== 0;

        const new_iar = {
            ...iar, 
            site_id_list,
            site_list,
            site_events_list,
            is_event_entry
        };

        return new_iar;
    });
    return processed_i_n_r;
}


function IssuesAndReminderList (props) {
    const {
        classes,
    } = props;
    const [tile_data, setTileData] = useState([]);
    const [isOpenIssueReminderModal, setIsOpenIssueReminderModal] = useState(false);
    const [chosenIssueReminder, setChosenIssueReminder] = useState({});
    const [isUpdateNeeded, setIsUpdateNeeded] = useState(false);

    useEffect(() => {
        const input = {
            include_count: true,
            limit: null, offset: null,
            filters: [],
            search_str: "",
            // include_expired: false
            include_expired: true
        };

        getIssuesAndReminders(input, ret => {
            const issues_and_reminders = ret;
            setTileData(
                (
                    <Typography style={{ fontStyle: "italic" }}>
                    No active issues
                    </Typography>
                )
            );
            if (issues_and_reminders.length !== 0) {
                const processed_i_n_r = includeSiteList(issues_and_reminders);
                const final_tile_data = prepareTileData(classes, processed_i_n_r, handleEdit);
                setTileData(final_tile_data);
            }
        });
    }, []);

    const handleBoolean = data => () => {
        // NOTE: there was no need to use the bool for opening a modal or switch
        if (data === "is_issue_reminder_modal_open") {
            setIsOpenIssueReminderModal(!isOpenIssueReminderModal);
            setChosenIssueReminder({});
        }
    };

    const handleEdit = value => event => {
        setChosenIssueReminder(value);
        setIsOpenIssueReminderModal(true);
    };

    return (
        <div className={classes.root}>         
            <Grid container spacing={1}>
                <Grid item xs={12} md={12}>
                    <Button
                        aria-label="Post Issue/Reminder"
                        variant="contained"
                        color="primary"
                        size="small"
                        style={{ width: "auto" }}
                        onClick={handleBoolean("is_issue_reminder_modal_open")}
                    >
                        Post Issue/Reminder
                    </Button>                       
                </Grid>
                <Grid item xs={12} md={12}>
                    <Typography>
                        As of {moment().format("DD MMMM YYYY, HH:mm")}                        
                    </Typography>
                </Grid>
                <Grid item xs={12} md={12}>
                    <GridList cellHeight={180} className={classes.gridList}>
                        {tile_data}
                    </GridList>
                </Grid>
            </Grid>

            <IssuesAndReminderModal
                isOpen={isOpenIssueReminderModal}
                closeHandler={handleBoolean("is_issue_reminder_modal_open")}
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
                chosenIssueReminder={chosenIssueReminder}
            />
        </div>
    );
}

export default compose(withStyles(styles), withMobileDialog())(IssuesAndReminderList);
