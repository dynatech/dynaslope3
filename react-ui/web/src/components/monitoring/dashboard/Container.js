import React, { Component, Fragment } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { withStyles } from "@material-ui/core/styles";
import { compose } from "recompose";
import { Button } from "@material-ui/core";
import { AddAlert } from "@material-ui/icons";
import PageTitle from "../../reusables/PageTitle";
import TabBar from "../../reusables/TabBar";
import MonitoringTables from "./MonitoringTables";
import GeneratedAlerts from "./GeneratedAlerts";
import AlertReleaseFormModal from "../../widgets/alert_release_form/AlertReleaseFormModal";
import CircularAddButton from "../../reusables/CircularAddButton";
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
        generated_alerts_data: [],
        candidate_alerts_data: [],
        alerts_from_db_data: { latest: [], extended: [], overdue: [] },
        is_open_release_modal: false
    }

    componentDidMount () {
        const socket_fns = {
            receive_generated_alerts: (err, data) => {
                const generated_alerts_data = JSON.parse(data);
                // console.log(generated_alerts_data);
                this.setState({ generated_alerts_data });
            },
            receive_candidate_alerts: (err, data) => {
                const candidate_alerts_data = JSON.parse(data);
                console.log(candidate_alerts_data);
                this.setState({ candidate_alerts_data });
            },
            receive_alerts_from_db: (err, data) => {
                const alerts_from_db_data = JSON.parse(data);
                console.log(alerts_from_db_data);
                this.setState({ alerts_from_db_data });
            }
        };
        subscribeToWebSocket(socket_fns);
        // subscribeToWebSocket("candidate_alerts", (err, candidate_alerts_data) => this.setState({ candidate_alerts_data }));
        // subscribeToWebSocket("alerts_from_db", (err, candidate_alerts_data) => this.setState({ candidate_alerts_data }));
    }

    componentWillUnmount () {
        unsubscribeToWebSocket();
    }

    handleTabSelected = chosen_tab => {
        this.setState({
            chosen_tab
        });
    }

    handleBoolean = (data, bool) => () => {
        this.setState({ [data]: bool });
    }

    render () {
        const {
            chosen_tab, generated_alerts_data, candidate_alerts_data,
            alerts_from_db_data, is_open_release_modal } = this.state;
        const { classes, width } = this.props;

        const is_desktop = isWidthUp("md", width);

        const custom_buttons = <span>
            <Button
                aria-label="Compose message"
                variant="contained"
                color="primary"
                size="small"
                style={{ marginRight: 8 }}
                onClick={this.handleBoolean("is_open_release_modal", true)}
            >
                <AddAlert style={{ paddingRight: 4, fontSize: 20 }} />
                Release Alert
            </Button>
        </span>;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle
                        title="Alert Monitoring | Dashboard"
                        customButtons={is_desktop ? custom_buttons : false}
                    />
                </div>

                <div className={classes.tabBar}>
                    <TabBar
                        chosenTab={chosen_tab}
                        onSelect={this.handleTabSelected}
                        tabsArray={tabs_array}
                    />
                </div>

                <div className={`${classes.pageContentMargin} ${classes.tabBarContent}`}>
                    {chosen_tab === 0 && <MonitoringTables width={width} candidateAlertsData={candidate_alerts_data} alertsFromDbData={alerts_from_db_data} />}
                    {chosen_tab === 1 && <GeneratedAlerts generated_alerts_data={generated_alerts_data} />}
                </div>

                {!is_desktop && <CircularAddButton clickHandler={this.handleBoolean("is_open_release_modal", true)} />}

                <AlertReleaseFormModal isOpen={is_open_release_modal} closeHandler={this.handleBoolean("is_open_release_modal", false)} />
            </Fragment>
        );
    }
}

export default compose(withWidth(), withStyles(styles))(Container);
