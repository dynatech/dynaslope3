
import React, { Fragment, useState } from "react";

import {
    Button, Menu, MenuItem, Tooltip
} from "@material-ui/core";
import { ArrowDropDown } from "@material-ui/icons";

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
    { label: "4 hours", hour_value: 4 },
    { label: "8 hours", hour_value: 8 },
    { label: "12 hours", hour_value: 12 },
    { label: "1 day", hour_value: 24 }
];

function DateRangeSelector (props) {
    const {
        isSubsurface, selectedRangeInfo,
        setSelectedRangeInfo, selectedHourInterval,
        setSelectedHourInterval, disableAll
    } = props;
    const [date_range_anchor, setDateRangeAnchor] = useState(null);
    const [hour_interval_anchor, setHourIntervalAnchor] = useState(null);
    const disable_all = typeof disableAll === "undefined" ? false : disableAll;
    const is_subsurface = typeof isSubsurface === "undefined" ? false : isSubsurface;
    let default_label = "";

    if (selectedHourInterval) {
        const { label } = selectedHourInterval;
        default_label = label;
    }

    const dateRangeHandleClick = event => {
        setDateRangeAnchor(event.currentTarget);
    };

    const dateRangeHandleClose = () => {
        setDateRangeAnchor(null);
    };

    const dateRangeSelected = data => {
        setSelectedRangeInfo(data);
        setDateRangeAnchor(null);
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
        return (
            <Fragment>
                <Tooltip title="Select time interval" arrow>
                    <Button 
                        variant="contained"
                        color="primary"
                        size="small" 
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        onClick={hourIntervalHandleClick}
                        style={{ marginRight: 6 }}
                        endIcon={<ArrowDropDown />}
                    >
                        {default_label}
                    </Button>
                </Tooltip>

                <Menu
                    id="simple-menu"
                    anchorEl={hour_interval_anchor}
                    keepMounted
                    open={Boolean(hour_interval_anchor)}
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
    };

    return (
        <div>
            {
                is_subsurface && SubsurfaceHourInterval()
            }

            <Tooltip title="Select date range" arrow>
                <Button 
                    variant="contained"
                    color="primary"
                    size="small" 
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    onClick={dateRangeHandleClick}
                    style={{ marginRight: is_subsurface ? 8 : 0 }}
                    endIcon={<ArrowDropDown />}
                >
                    {selectedRangeInfo.label}
                </Button>
            </Tooltip>

            <Menu
                id="simple-menu"
                anchorEl={date_range_anchor}
                keepMounted
                open={Boolean(date_range_anchor)}
                onClose={dateRangeHandleClose} 
            >
                {
                    date_range_options.map((row, index) => {
                        const { label, unit } = row;
                        if (unit === "all" && disable_all) return null;

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
        </div>

    );
}

export default DateRangeSelector;
