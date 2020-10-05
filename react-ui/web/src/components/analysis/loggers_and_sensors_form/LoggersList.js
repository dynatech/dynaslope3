import React, { useState, useEffect } from "react";

import {
    List, ListItem, ListItemText,
    OutlinedInput, makeStyles
} from "@material-ui/core";

import { getLoggersAndSensorsData } from "../ajax";

const useStyles = makeStyles(theme => ({
    list: {
        maxHeight: "60vh",
        overflowY: "auto",
        boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
        "&::-webkit-scrollbar": {
            width: 5
        },
        "&::-webkit-scrollbar-track": {
            boxShadow: "inset 0 0 5px grey"
        },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(127, 127, 127, 0.7)"
        }
    },
    searchBox: {
        marginBottom: theme.spacing(3)
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
}));

function LoggersList (props) {
    const { selectedLogger, onLoggerClickFn } = props;
    const classes = useStyles();

    const [loggers, setLoggers] = useState([]);
    const [loggers_list, setLoggersList] = useState([]);
    const [search_str, setSearchStr] = useState(null);

    useEffect(() => {
        getLoggersAndSensorsData(data => {
            const { loggers: temp_l, rain_gauges } = data;
            temp_l.forEach(x => {
                const { logger_model: { has_rain }, logger_name } = x;

                if (has_rain) {
                    const rg = rain_gauges.find(y=> y.gauge_name === logger_name);
                    x.rain_gauge = rg || null;
                }
            });

            setLoggers(temp_l);
            setLoggersList(temp_l);

            if (temp_l.length > 0) onLoggerClickFn(temp_l[0])();
        });
    }, []);

    useEffect(() => {
        if (search_str !== null) {
            const filtered = loggers_list.filter(row => {
                const { logger_name } = row;
                const pattern = new RegExp(`${search_str.toLowerCase()}`, "gi");
                return pattern.test(logger_name.toLocaleLowerCase());
            });
            setLoggers(filtered);
        } else {
            setLoggers(loggers);
        }
    }, [search_str]);

    return (
        <div className={classes.sticky}>
            <OutlinedInput
                fullWidth
                margin="dense"
                placeholder="Search loggers..."
                onChange={event => setSearchStr(event.target.value)} 
                className={classes.searchBox}
            />

            <List aria-label="list" className={classes.list}>
                {
                    loggers.map(logger => {
                        const { logger_name, logger_id } = logger;
                        const is_selected = selectedLogger !== null && selectedLogger.logger_id === logger_id;

                        return (
                            <ListItem 
                                button 
                                key={logger.logger_id} 
                                onClick={onLoggerClickFn(logger)}
                                selected={is_selected}
                            >
                                <ListItemText primary={logger_name.toUpperCase()} />
                            </ListItem>
                        );
                    })
                }
            </List>
        </div>
    );
}

export default React.memo(LoggersList);