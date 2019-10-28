import React, { Fragment, useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";

import {
    Typography, GridList, 
    GridListTile, GridListTileBar, 
    IconButton,
    Tooltip
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";

import IssuesAndReminderModal from "./IssuesAndReminderModal";
import { receiveIssuesAndReminders } from "../../../websocket/monitoring_ws";


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
    gridList: {
        height: "75vh",
        margin: "0 !important",
        boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
        "&::-webkit-scrollbar": {
            width: 5
        },
        "&::-webkit-scrollbar-track": {
            boxShadow: "inset 0 0 5px grey"
        },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(127, 127, 127, 0.7)"
        },
        position: "sticky",
        top: 148,
        padding: 8
    },
    icon: {
        color: "rgba(255, 255, 255, 0.54)",
    },
    previewText: {
        padding: "12px",
        fontSize: "14px"
    },
    tile: {
        border: "0.5px solid #b2b2b2",
        padding: "0 !important",
        marginBottom: 6,
        "&:last-of-type": {
            marginBottom: 0
        }
    },
    tileBar: {
        background: "#7f7f7f"
    }
});

function prepareTileData (classes, processed_i_n_r, handleEdit) {
    return processed_i_n_r.map((tile, index) => {
        const { 
            site_list, detail, 
            issue_reporter, title 
        } = tile;
        
        let item_title = "GENERAL";
        if (site_list.length !== 0) {
            item_title = site_list.join(", ");
        }
        
        return (
            <GridListTile
                key={`test ${index + 1}`}
                cols={2}
                className={classes.tile}
            >
                <Typography className={classes.previewText}>
                    {detail}
                </Typography>
                <GridListTileBar
                    className={classes.tileBar}
                    title={item_title}
                    subtitle={`${issue_reporter.first_name} ${issue_reporter.last_name}`}
                    actionIcon={
                        <Tooltip title="Expand card">
                            <IconButton 
                                aria-label="Expand"
                                className={classes.icon}
                                onClick={handleEdit(tile)}
                            >
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
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
        receiveIssuesAndReminders(issues_and_reminders => {
            let final_tile_data = (
                <Typography style={{ fontStyle: "italic" }}>
                        No active issues
                </Typography>
            );
            if (issues_and_reminders.length !== 0) {
                const processed_i_n_r = includeSiteList(issues_and_reminders);
                final_tile_data = prepareTileData(classes, processed_i_n_r, handleEdit);
            }

            setTileData(final_tile_data);
        });
    }, [classes]);

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
        <Fragment>         
            {/* <Grid container spacing={1}>
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
            </Grid> */}
            
            <GridList cellHeight={180} className={classes.gridList}>
                {tile_data}
            </GridList>

            <IssuesAndReminderModal
                isOpen={isOpenIssueReminderModal}
                closeHandler={handleBoolean("is_issue_reminder_modal_open")}
                setIsUpdateNeeded={setIsUpdateNeeded}
                isUpdateNeeded={isUpdateNeeded}
                chosenIssueReminder={chosenIssueReminder}
            />
        </Fragment>
    );
}

export default withStyles(styles)(IssuesAndReminderList);
