import React, {
    Fragment, useState, useEffect,
    createContext
} from "react";
import { matchPath } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import TabBar from "../../reusables/TabBar";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import EndOfShiftGenerator from "./EndOfShiftGenerator";
import MonitoringShifts from "./MonitoringShifts";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        tabBarContent: {
            marginTop: 30
        }
    }; 
});

const tabs_array = [
    { label: "End-of-Shift Report Generator", href: "report_generator" },
    { label: "Monitoring Shifts", href: "shifts" }
];

export const CalendarContext = createContext();

function Container (props) {
    const { history, match: { url }, location: { pathname } } = props;
    const [chosenTab, setChosenTab] = useState(0);
    const classes = useStyles();

    const [open_calendar_on_start, setOpenCalendarOnStart] = useState(false);

    useEffect(() => {
        const match = matchPath(pathname, {
            path: `${url}/:tab`,
            exact: true
        });
    
        if (match) {
            const { params: { tab } } = match;
            const index = tabs_array.findIndex(x => x.href === tab);
            setChosenTab(index);
            
            if (index === 1) setOpenCalendarOnStart(true);
        }
    }, [url]);

    const handleTabSelected = chosen_tab => {
        setChosenTab(chosen_tab);
        history.push(`${url}/${tabs_array[chosen_tab].href}`);
    };

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle title="Alert Monitoring | Shifts & Reports" />
            </div>

            <div className={classes.tabBar}>
                <TabBar 
                    chosenTab={chosenTab}
                    onSelect={handleTabSelected}
                    tabsArray={tabs_array}
                />
            </div>
            
            <div className={`${classes.pageContentMargin} ${classes.tabBarContent}`}>
                <EndOfShiftGenerator hidden={chosenTab !== 0} />
                <MonitoringShifts hidden={chosenTab !== 1} defaultCalendarOpen={open_calendar_on_start} />
            </div>

        </Fragment>
    );
}


export default Container;
