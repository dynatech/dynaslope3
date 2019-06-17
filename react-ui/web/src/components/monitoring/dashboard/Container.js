import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
import PageTitle from "../../reusables/PageTitle";
import TabBar from "../../reusables/TabBar";
import MonitoringTables from "./MonitoringTables";
import GeneratedAlerts from "./GeneratedAlerts";
import AlertReleaseFormModal from "../../widgets/alert_release_form/AlertReleaseFormModal";
import GeneralStyles from "../../../GeneralStyles";
import { subscribeToWebSocket, unsubscribeToWebSocket } from "../../../websocket/monitoring_ws";

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
    { label: "Monitoring Tables", href: "monitoring-tables" },
    { label: "Generated Alerts", href: "generated-alerts" }
];


class Container extends Component {
    state = {
        chosen_tab: 0,
        generated_alerts_data: []
    }

    componentDidMount() {
        subscribeToWebSocket((err, generated_alerts_data) => this.setState({ generated_alerts_data }));
    }

    componentWillUnmount() {
        unsubscribeToWebSocket()
    }

    handleTabSelected = chosen_tab => {
        this.setState({
            chosen_tab
        });
    }

    render() {
        const { chosen_tab, generated_alerts_data } = this.state;
        const { classes } = this.props;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle title="Alert Monitoring | Dashboard" />
                </div>

                <div className={classes.tabBar}>
                    <TabBar
                        chosenTab={chosen_tab}
                        onSelect={this.handleTabSelected}
                        tabsArray={tabs_array}
                    />
                </div>

                <div className={`${classes.pageContentMargin} ${classes.tabBarContent}`}>
                    {chosen_tab === 0 && <MonitoringTables />}
                    {chosen_tab === 1 && <GeneratedAlerts generated_alerts_data={generated_alerts_data} />}
                </div>

                <AlertReleaseFormModal />
            </Fragment>
        );
    }
}

export default withStyles(styles)(Container);
