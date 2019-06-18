import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Grid, Divider, Button } from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Route, Switch } from "react-router-dom";
import { Create, Search } from "@material-ui/icons";
import { compose } from "recompose";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";
import ConversationWindow from "./ConversationWindow";
import TabBar from "../../reusables/TabBar";
import { sample_messages, sample_messages_2, sample_messages_3 } from "../../../store";
import SendMessageModal from "./SendMessageModal";
import CircularAddButton from "../../reusables/CircularAddButton";
import SearchMessageModal from "./SearchMessageModal";

const styles = theme => {
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

    }; 
};

const tabs_array = [
    { label: "Inbox", href: "inbox" },
    { label: "Unregistered", href: "unregistered" },
    { label: "Event", href: "event" }
];

class Container extends Component {
    constructor (props) {
        super(props);

        const bool = props.match.url !== props.location.pathname;
            
        this.state = {
            chosen_tab: 0,
            has_chosen_message: bool,
            is_open_send_modal: false,
            is_open_search_modal: false
        };
    }
    
    componentWillUnmount () {
        this.setState({
            chosen_tab: 0,
            has_chosen_message: false,
            is_open_send_modal: false,
            is_open_search_modal: false
        });
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    };

    handleBoolean = (key, value) => () => {
        this.changeState(key, value);
    }

    handleModalState = prop => bool => () => {
        this.changeState(prop, bool);
    }

    handleTabSelected = chosen_tab => {
        this.setState({
            chosen_tab
        });
    }

    handleCompoundFn = () => {
        this.setState({
            has_chosen_message: false,
            is_open_search_modal: false
        });
    };

    render () {
        const { classes, match: { url }, width } = this.props;
        const {
            chosen_tab, has_chosen_message,
            is_open_send_modal, is_open_search_modal
        } = this.state;
        const is_desktop = isWidthUp("md", width);

        const custom_buttons = <span>
            <Button
                aria-label="Compose message"
                variant="contained" 
                color="primary"
                size="small" 
                style={{ marginRight: 8 }}
                onClick={this.handleBoolean("is_open_send_modal", true)}
            >
                <Create style={{ paddingRight: 4, fontSize: 20 }}/>
                Compose
            </Button>

            <Button 
                aria-label="Search messages"
                variant="contained"
                color="primary"
                size="small"
                onClick={this.handleBoolean("is_open_search_modal", true)}
            >
                <Search style={{ paddingRight: 4, fontSize: 20 }}/>
                Search
            </Button>
        </span>;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle
                        title="Communications | Chatterbox" 
                        customButtons={is_desktop && !has_chosen_message ? custom_buttons : false}
                    />
                </div>

                { !has_chosen_message
                    ? (<Fragment>
                        <div className={classes.tabBar}>
                            <TabBar 
                                chosenTab={chosen_tab}
                                onSelect={this.handleTabSelected}
                                tabsArray={tabs_array}
                            />
                        </div>

                        <div className={`${classes.tabBar} ${classes.tabBarContent}`}>
                            {
                                chosen_tab === 0 && (
                                    <MessageList
                                        url={url}
                                        messages={sample_messages}
                                        clickHandler={this.handleBoolean("has_chosen_message", true)} 
                                    />
                                )
                            }

                            {
                                chosen_tab === 1 && (
                                    <MessageList
                                        url={url}
                                        messages={sample_messages_2}
                                        clickHandler={this.handleBoolean("has_chosen_message", true)} 
                                    />
                                )
                            }

                            {
                                chosen_tab === 2 && (
                                    <MessageList
                                        url={url}
                                        messages={sample_messages_3}
                                        clickHandler={this.handleBoolean("has_chosen_message", true)} 
                                    />
                                )
                            }
                        </div>

                        { !is_desktop && <CircularAddButton clickHandler={this.handleBoolean("is_open_send_modal", true)} />}

                        <SendMessageModal
                            modalStateHandler={this.handleModalState("is_open_send_modal")} 
                            modalState={is_open_send_modal}
                        />

                        <SearchMessageModal 
                            modalStateHandler={this.handleModalState("is_open_search_modal")}
                            clickHandler={this.handleBoolean("has_chosen_message", true)}
                            modalState={is_open_search_modal}
                            url={url}
                        />
                    </Fragment>)
                    : <div className={classes.tabBar}>
                        <Divider />
                    </div>
                }

                <Switch>
                    <Route exact path={`${url}/search_results`} render={
                        props => <ConversationWindow 
                            {...props} 
                            backHandler={this.handleCompoundFn} 
                        />} 
                    />

                    <Route path={`${url}/:message_id`} render={
                        props => <ConversationWindow 
                            {...props} 
                            backHandler={this.handleBoolean("has_chosen_message", false)} 
                        />} 
                    />
                </Switch>
            </Fragment>
        );
    }
}

export default compose(withWidth(), withStyles(styles))(Container);
