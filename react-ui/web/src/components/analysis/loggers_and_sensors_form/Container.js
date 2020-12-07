import React, { 
    Fragment, useState
} from "react";

import {
    Grid, useTheme, useMediaQuery,
    Button
} from "@material-ui/core";
import { AddBox } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";

import LoggersList from "./LoggersList";
import LoggerDetails from "./LoggerDetails";
import AddLoggerForm from "./AddLoggerForm";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 16
        },
        sticky: {
            position: "sticky",
            top: 146,
            [theme.breakpoints.down("sm")]: {
                top: 48
            },
            backgroundColor: "white",
            zIndex: 1
        },
        noFlexGrow: { flexGrow: 0 },
        paper: {
            position: "fixed",
            right: 0,
            top: 116,
            width: 400
        },
        overflow: {
            overflowY: "auto",
            height: "calc(100vh - 250px)",
            [theme.breakpoints.down("md")]: {
                height: "80vh"
            }
        },
        insetDivider: { padding: "8px 70px !important" },
        nested: { paddingLeft: theme.spacing(4) },
        hidden: { display: "none !important" },
        form_message_style: {
            color: "red",
            fontStyle: "italic"
        },
    };
});

function CustomButtons (setIsAddLogger) {
    return <span>
        <Button
            aria-label="Add logger"
            variant="contained" 
            color="primary"
            size="small" 
            onClick={() => setIsAddLogger(true)}
            startIcon={<AddBox />}
        >
            Add logger
        </Button>
    </span>;
}

function Container (props) {
    const classes = useStyles();
    const theme = useTheme();
    const is_desktop = useMediaQuery(theme.breakpoints.up("sm"));
    
    const [is_add_logger, setIsAddLogger] = useState(false);
    const [selected_logger, setSelectedLogger] = useState(null);
    const [reload_list, setReloadList] = useState(false);
    const [loggers, setLoggers] = useState([]);
    const onLoggerClickFn = logger => () => {
        setSelectedLogger(logger);
        console.log("Selected logger", logger);
    };

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Analysis | Loggers and Sensors Form"
                    className={classes.sticky}
                    customButtons={is_desktop ? CustomButtons(setIsAddLogger) : false}
                />

                <Grid
                    container spacing={2} 
                    justify="space-evenly"
                >
                    <Grid item xs={12} sm={3} lg={2}>
                        <LoggersList
                            selectedLogger={selected_logger}
                            onLoggerClickFn={onLoggerClickFn}
                            reloadList={reload_list}
                            loggers={loggers}
                            setLoggers={setLoggers}
                            setReloadList={setReloadList}
                        />
                    </Grid>

                    <Grid item xs={12} sm={9} lg={10}>
                        { !is_add_logger && selected_logger !== null && <LoggerDetails
                            selectedLogger={selected_logger}
                            setReloadList={setReloadList}
                        />}
                        { is_add_logger && <AddLoggerForm setIsAddLogger={setIsAddLogger} setReloadList={setReloadList} /> }
                    </Grid>
                </Grid>
            </div>
        </Fragment>
    );
}

export default Container;