
import React, { Fragment, useState } from "react";

import { Button, IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";

const goBack = history => e => {
    e.preventDefault();
    history.push("/analysis/sites");
    history.replace("/analysis/sites");
};

const date_range_options = [
    { label: "3 days", unit: "days", duration: 3 },
    { label: "7 days", unit: "days", duration: 7 },
    { label: "10 days", unit: "days", duration: 10 },
    { label: "2 weeks", unit: "weeks", duration: 2 },
    { label: "1 month", unit: "months", duration: 1 },
    { label: "3 months", unit: "months", duration: 3 },
    { label: "6 months", unit: "months", duration: 6 },
    { label: "1 year", unit: "years", duration: 1 },
    { label: "All", unit: "all", duration: 0 }
];

const hour_interval = [
    { label: "4 hours", hour_value: "4" },
    { label: "8 hours", hour_value: "8" },
    { label: "12 hours", hour_value: "12" },
    { label: "1 day", hour_value: "24" }
];

function BackToMainButton (props) {
    const { width, history, chartType,
        selected, setSelected, setSelectedRangeInfo,
        selected_hour_interval, setSelectedHourInterval } = props;
    const [ dateRangeAnchor, setDateRangeAnchor ] = useState(null);
    const [ hourIntervalAnchor, setHourIntervalAnchor ] = useState(null);
    const [ show_hour_interval, setShowHourInterval ] = useState(false);
    let default_label = "";
    if (selected_hour_interval) {
        const { label } = selected_hour_interval;
        default_label = label;
    }

    
    const dateRangeHandleClick = event => {
        setDateRangeAnchor(event.currentTarget);
        setShowHourInterval(false);
    };

    const dateRangeHandleClose = () => {
        setDateRangeAnchor(null);
    };

    const dateRangeSelected = data => {
        const { label } = data;
        setSelected(label);
        setSelectedRangeInfo(data);
        setDateRangeAnchor(null);
        setShowHourInterval(true);
    };

    const hourIntervalHandleClick = event => {
        setHourIntervalAnchor(event.currentTarget);
    };

    const hourIntervalHandleClose = () => {
        setHourIntervalAnchor(null);
    };

    const hourIntervalSelected = data => {
        setSelectedHourInterval(data);
        setHourIntervalAnchor(null);
    };
    
    const SubsurfaceHourInterval = () => {
        if (chartType === "subsurface" && show_hour_interval) {
            
            return (
                <Fragment>
                    <Tooltip title="Select hour interval" arrow>
                        <Button 
                            variant="contained"
                            color="primary"
                            size="small" 
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            onClick={hourIntervalHandleClick}  
                        >
                            {default_label}
                        </Button>

                    </Tooltip>
                    <Menu
                        id="simple-menu"
                        anchorEl={hourIntervalAnchor}
                        keepMounted
                        open={Boolean(hourIntervalAnchor)}
                        onClose={hourIntervalHandleClose} 
                    >
                        {
                            hour_interval.map((row, index) => {
                                const { label } = row;
                                return (
                                    <MenuItem
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={`hour_interval_${index}`} 
                                        onClick={() => hourIntervalSelected(row)}>
                                        {label}
                                    </MenuItem>
                                );
                            })
                        }
                
                    </Menu>
                </Fragment>
            );
        }

        return ("");
    };

    return (
        isWidthDown(width, "sm") ? (<Fragment>
            <Button
                variant="contained"
                color="primary"
                size="small" 
                onClick={goBack(history)}
                style={{ marginRight: 8 }}
            >
                <ArrowBackIos style={{ fontSize: 16 }}/> Back to site list
            </Button>
            <Tooltip title="Select date range" arrow>
                <Button 
                    variant="contained"
                    color="primary"
                    size="small" 
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    onClick={dateRangeHandleClick}
                    style={{ marginRight: 8 }}
                >
                    {selected}
                </Button>
            </Tooltip>
            <Menu
                id="simple-menu"
                anchorEl={dateRangeAnchor}
                keepMounted
                open={Boolean(dateRangeAnchor)}
                onClose={dateRangeHandleClose} 
            >
                {
                    date_range_options.map((row, index) => {
                        const { label } = row;
                        return (
                            <MenuItem
                                // eslint-disable-next-line react/no-array-index-key
                                key={`date_range_${index}`} 
                                onClick={() => dateRangeSelected(row)}>
                                {label}
                            </MenuItem>
                        );
                    })
                }
                
            </Menu>
            {SubsurfaceHourInterval()}
        </Fragment>) : (<IconButton
            variant="contained"
            color="primary"
            size="small" 
            onClick={goBack(history)}
            style={{ marginLeft: 6 }}
        >
            <ArrowBackIos />
        </IconButton>)
    );
}

export default BackToMainButton;
