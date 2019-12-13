import React, {
    Fragment, useState,
    useEffect
} from "react";
import { Button, Badge, makeStyles } from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Route, Switch } from "react-router-dom";
import { Create, Search } from "@material-ui/icons";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";
import ConversationWindow from "./ConversationWindow";
import TabBar from "../../reusables/TabBar";
import SendMessageModal from "./SendMessageModal";
import CircularAddButton from "../../reusables/CircularAddButton";
import SearchMessageModal from "./SearchMessageModal";
import SearchResultsPage from "./SearchResultsPage";

import { 
    socket, subscribeToWebSocket, unsubscribeToWebSocket 
} from "../../../websocket/communications_ws";

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

    }; 
});

function Container (comp_props) {
    const { location, match: { url }, width } = comp_props;
    const classes = useStyles();

    const [chosen_tab, setChosenTab] = useState(0);
    const [is_open_send_modal, setIsOpenSendModal] = useState(false);
    const [is_open_search_modal, setIsOpenSearchModal] = useState(false);
    const [message_collection, setMessagesCollection] = useState({
        inbox: [],
        unsent: []
    });
    const [tabs_array, setTabsArray] = useState([
        { label: "Inbox", href: "inbox" },
        { label: "Unsent", href: "unsent" },
        // { label: "Dynaslope", href: "dynaslope" }
    ]);

    const set_modal_fn = (key, bool) => () => {
        if (key === "send") setIsOpenSendModal(bool);
        else if (key === "search") setIsOpenSearchModal(bool);
    };

    useEffect(() => {
        subscribeToWebSocket(data => {
            setMessagesCollection(data);
            
            const { unsent: { length } } = data;
            let label = "Unsent";
            const index = tabs_array.findIndex(x => x.href === label);
            if (length > 0) {
                label = <Badge
                    style={{ padding: "0 8px" }}
                    color="secondary" 
                    badgeContent={length}
                    overlap="rectangle"
                >
                    Unsent
                </Badge>;
            }
            setTabsArray(prev => [...prev.slice(0, index), { label, href: "unsent" }]);
        });

        return () => unsubscribeToWebSocket();
    }, []);

    const is_desktop = isWidthUp("md", width);

    const custom_buttons = <span>
        <Button
            aria-label="Compose message"
            variant="contained" 
            color="primary"
            size="small" 
            style={{ marginRight: 8 }}
            onClick={set_modal_fn("send", true)}
        >
            <Create style={{ paddingRight: 4, fontSize: 20 }}/>
            Compose
        </Button>

        <Button 
            aria-label="Search messages"
            variant="contained"
            color="primary"
            size="small"
            onClick={set_modal_fn("search", true)}
        >
            <Search style={{ paddingRight: 4, fontSize: 20 }}/>
            Search
        </Button>
    </span>;

    return (
        <Switch location={location}>
            <Route exact path={url} 
                render={ props => (
                    <Fragment>
                        <div className={classes.pageContentMargin}>
                            <PageTitle
                                title="Communications | Chatterbox" 
                                customButtons={is_desktop ? custom_buttons : false}
                            />
                        </div>

                        <div className={classes.tabBar}>
                            <TabBar 
                                chosenTab={chosen_tab}
                                onSelect={tab => setChosenTab(tab)}
                                tabsArray={tabs_array}
                            />
                        </div>

                        <div className={`${classes.tabBar} ${classes.tabBarContent}`}>
                            {
                                // chosen_tab === 0 && (
                                //     <MessageList
                                //         width={width}
                                //         url={url}
                                //         messagesArr={message_collection.inbox}
                                //  
                                //     />
                                // )
                            }

                            <MessageList
                                width={width}
                                url={url}
                                messagesArr={message_collection.inbox}
                                hidden={chosen_tab !== 0}
                                is_desktop={is_desktop}
                            />

                            {
                                // chosen_tab === 1 && (
                                //     <MessageList
                                //         width={width}
                                //         url={url}
                                //         messagesArr={message_collection.unsent}
                                //  
                                //     />
                                // )
                            }

                            <MessageList
                                width={width}
                                url={url}
                                messagesArr={message_collection.unsent}
                                async
                                hidden={chosen_tab !== 1}
                                is_desktop={is_desktop}
                            />

                            {/* {
                                chosen_tab === 2 && (
                                    <MessageList
                                        width={width}
                                        url={url}
                                        messagesArr={[]}
         
                                    />
                                )
                            } */}
                        </div>

                        { !is_desktop && <CircularAddButton clickHandler={set_modal_fn("send", true)} />}

                        <SendMessageModal
                            modalStateHandler={set_modal_fn("send", false)} 
                            modalState={is_open_send_modal}
                        />

                        <SearchMessageModal 
                            modalStateHandler={set_modal_fn("search", false)}
                            modalState={is_open_search_modal}
                            url={url}
                        /> 
                    </Fragment>
                )}
            />
            
            <Route path={`${url}/search_results`} render={
                props => <SearchResultsPage
                    {...props}
                    messageCollection={message_collection}
                    socket={socket}
                />
            } 
            />

            <Route path={`${url}/:mobile_id`} render={
                props => <ConversationWindow 
                    {...props}
                    messageCollection={message_collection}
                    socket={socket}
                />
            } 
            />
        </Switch>
    );

}

export default withWidth()(Container);
