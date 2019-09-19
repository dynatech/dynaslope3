import React, { Component, Fragment, useState } from "react";
import { withStyles } from "@material-ui/core/styles";
import TabBar from "../../reusables/TabBar";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import EndOfShiftGenerator from "./EndOfShiftGenerator";
import MonitoringShiftChecker from "./MonitoringShiftChecker";

const styles = theme => {
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
};

const tabs_array = [
    { label: "End-of-Shift Report Generator", href: "report-generator" },
    { label: "Monitoring Shift Checker", href: "shift-checker" }
];


function Container (props) {
    const { classes } = props;
    const [chosenTab, setChosenTab] = useState(0);

    const handleTabSelected = chosen_tab => {
        setChosenTab(chosen_tab);
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
                {chosenTab === 0 && <EndOfShiftGenerator />}
                {chosenTab === 1 && <MonitoringShiftChecker/>}
            </div>

        </Fragment>
    );
}


export default withStyles(styles)(Container);
