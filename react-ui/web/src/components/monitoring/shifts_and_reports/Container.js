import React, { Component, Fragment } from "react";
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

class Container extends Component {
    state = {
        chosen_tab: 0
    }

    handleTabSelected = chosen_tab => {
        this.setState({
            chosen_tab
        });
    }

    render () {
        const { classes } = this.props;
        const { chosen_tab } = this.state;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle title="Alert Monitoring | Shifts & Reports" />
                </div>

                <div className={classes.tabBar}>
                    <TabBar 
                        chosenTab={chosen_tab}
                        onSelect={this.handleTabSelected}
                        tabsArray={tabs_array}
                    />
                </div>

                <div className={`${classes.pageContentMargin} ${classes.tabBarContent}`}>
                    {chosen_tab === 0 && <EndOfShiftGenerator />}
                    {chosen_tab === 1 && <MonitoringShiftChecker/>}
                </div>

            </Fragment>
        );
    }
}

export default withStyles(styles)(Container);
