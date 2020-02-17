import React, {
    Fragment, useState, useEffect
} from "react";

import {
    Typography, GridList, 
    GridListTile, GridListTileBar, 
    IconButton, Tooltip,
    Dialog, DialogContent, DialogTitle,
    DialogActions, Button, DialogContentText,
    makeStyles
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/InfoOutlined";

import moment from "moment";

import IssuesAndReminderModal from "./IssuesAndReminderModal";
import { receiveIssuesAndReminders } from "../../../websocket/monitoring_ws";

const useStyles = makeStyles(theme => ({
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
        height: "100vh",
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
    hasNoIssues: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "gainsboro",
        border: "4px solid #CCCCCC"
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
        background: "#7f7f7f",
        height: "50px !important"
    }
}));

function IssuesAndReminderCard (props) {
    const { 
        isCardModalOpen, chosenIssueReminder,
        setCardModalOpen, setIsOpenIssueReminderModal,
        setToResolve, setIsUpdateNeeded
    } = props;
    const { site_list, ts_posted, detail, issue_reporter } = chosenIssueReminder;
    const { first_name, last_name } = issue_reporter;

    const item_title = prepareTileTitle(site_list, false);
    const ts = moment(ts_posted).format("DD MMMM YYYY, HH:mm");

    const handleEdit = () => {
        setCardModalOpen(false);
        setToResolve(false);
        setIsOpenIssueReminderModal(true);
        setIsUpdateNeeded(true);

    };
    const handleResolve = () => {
        setCardModalOpen(false);
        setToResolve(true);
        setIsOpenIssueReminderModal(true);
        setIsUpdateNeeded(true);
    };
  
    return (
        <Dialog open={isCardModalOpen} maxWidth="sm">
            <DialogTitle style={{ paddingBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <InfoIcon style={{ paddingRight: 8 }} /> {item_title}
                </div>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>{ts}</DialogContentText>
                <DialogContentText style={{ textIndent: 40 }} align="justify">{detail}</DialogContentText>
                <DialogContentText align="right" style={{ marginBottom: 0 }}>{`${first_name} ${last_name}`}</DialogContentText>
            </DialogContent>
            <DialogActions disableSpacing>
                <Button onClick={handleEdit} color="primary">
                    Edit
                </Button>
                <Button onClick={handleResolve} color="secondary">
                    Resolve
                </Button>
                <Button onClick={() => setCardModalOpen(false)} color="primary" autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function prepareTileData (classes, processed_i_n_r, handleInfoExpand) {
    return processed_i_n_r.map((tile, index) => {
        const { 
            site_list, detail, 
            issue_reporter 
        } = tile;
        
        const item_title = prepareTileTitle(site_list);
        
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
                                onClick={handleInfoExpand(tile)}
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

function prepareTileTitle (site_list, to_caps_general) {
    let item_title = to_caps_general ? "GENERAL" : "General";
    if (site_list.length !== 0) {
        item_title = site_list.join(", ");
    }
    return item_title;
}

function includeSiteList (issues_and_reminders) {
    const processed_i_n_r = issues_and_reminders.map((iar, index) => {
        const site_id_list = [];
        const site_list = [];
        const site_events_list = [];

        const is_persistent = iar.ts_expiration === null;

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
            is_event_entry,
            is_persistent
        };

        return new_iar;
    });

    return processed_i_n_r;
}

function IssuesAndReminderList (props) {
    const {
        isOpenIssueReminderModal, setIsOpenIssueReminderModal,
        isUpdateNeeded, setIsUpdateNeeded
    } = props;

    const classes = useStyles();

    const [tile_data, setTileData] = useState([]);
    const [has_active_issues, setHasActiveIssues] = useState(false);
    const [chosenIssueReminder, setChosenIssueReminder] = useState({
        site_list: [],
        site_id_list: null,
        ts_posted: null,
        detail: "", issue_reporter: { first_name: "", last_name: "" }
    });
    const [is_card_modal_open, setCardModalOpen] = useState(false);
    const [toResolve, setToResolve] = useState(false);

    useEffect(() => {
        receiveIssuesAndReminders(issues_and_reminders => {
            setHasActiveIssues(false);
            let final_tile_data = (
                <Typography component="div" style={{ fontStyle: "italic", width: "auto", height: 0 }}>
                   No active issues
                </Typography>
            );

            if (issues_and_reminders.length !== 0) {
                const processed_i_n_r = includeSiteList(issues_and_reminders);
                final_tile_data = prepareTileData(classes, processed_i_n_r, handleInfoExpand);
                setHasActiveIssues(true);
               
            }

            setTileData(final_tile_data);
        });
    }, [classes]);

    const handleInfoExpand = value => event => {
        setChosenIssueReminder(value);
        setCardModalOpen(true);
       
    };
    const closeModal = () => {
        setIsOpenIssueReminderModal(false);
    };

    return (
        
        <Fragment>         
          
            <GridList component="div" cellHeight="auto" className={`${classes.gridList} ${!has_active_issues && classes.hasNoIssues}`}>
                {tile_data}
            </GridList>
            
            <IssuesAndReminderCard 
                isCardModalOpen={is_card_modal_open}
                setCardModalOpen={setCardModalOpen}
                chosenIssueReminder={chosenIssueReminder}
                setToResolve={setToResolve}
                setIsOpenIssueReminderModal={setIsOpenIssueReminderModal}
                setIsUpdateNeeded={setIsUpdateNeeded}
            />
            
            <IssuesAndReminderModal
                isOpen={isOpenIssueReminderModal}
                isUpdateNeeded={isUpdateNeeded}
                chosenIssueReminder={chosenIssueReminder}
                setIsUpdateNeeded={setIsUpdateNeeded}
                setToResolve={toResolve}
                closeHandler ={closeModal}
            
            />
        </Fragment>
    );
}

export default IssuesAndReminderList;
