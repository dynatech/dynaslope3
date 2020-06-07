import React, {
    Fragment, useState,
    useEffect, useContext
} from "react";
import { Button, Badge, makeStyles } from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Route, Switch } from "react-router-dom";
import { Create, Search } from "@material-ui/icons";
import ContentLoader from "react-content-loader";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";
import ConversationWindow from "./ConversationWindow";
import TabBar from "../../reusables/TabBar";
import SendMessageModal from "./SendMessageModal";
import CircularAddButton from "../../reusables/CircularAddButton";
import SearchMessageModal from "./SearchMessageModal";
import SearchResultsPage from "./SearchResultsPage";
import { GeneralContext } from "../../contexts/GeneralContext"; 
import {
    socket, subscribeToWebSocket, removeReceiveLatestMessages,
    receiveAllMobileNumbers, receiveLatestMessages
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

const ListLoader = () => (
    <ContentLoader 
        height={400}
        width={600}
        speed={2}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
    >
        <circle cx="47" cy="48" r="26" /> 
        <rect x="90" y="36" rx="0" ry="0" width="489" height="29" /> 
        <circle cx="47" cy="108" r="26" /> 
        <rect x="90" y="96" rx="0" ry="0" width="489" height="29" /> 
        <circle cx="49" cy="168" r="26" /> 
        <rect x="90" y="156" rx="0" ry="0" width="489" height="29" />
        <circle cx="49" cy="228" r="26" /> 
        <rect x="90" y="216" rx="0" ry="0" width="489" height="29" />
        <circle cx="49" cy="288" r="26" /> 
        <rect x="90" y="276" rx="0" ry="0" width="489" height="29" />
        <circle cx="49" cy="348" r="26" /> 
        <rect x="90" y="336" rx="0" ry="0" width="489" height="29" />
    </ContentLoader>
);

function Container (comp_props) {
    const { location, match: { url }, width } = comp_props;
    const classes = useStyles();

    const [chosen_tab, setChosenTab] = useState(0);
    const [is_open_send_modal, setIsOpenSendModal] = useState(false);
    const [is_open_search_modal, setIsOpenSearchModal] = useState(false);
    const [message_collection, setMessagesCollection] = useState({
        inbox: null,
        unsent: null
    });
    const [tabs_array, setTabsArray] = useState([
        { label: "Inbox", href: "inbox" },
        { label: "Unsent", href: "unsent" },
        // { label: "Dynaslope", href: "dynaslope" }
    ]);
    const [search_results, setSearchResults] = useState([]);
    const [recipients_list, setRecipientsList] = useState([]);

    const set_modal_fn = (key, bool) => () => {
        if (key === "send") setIsOpenSendModal(bool);
        else if (key === "search") setIsOpenSearchModal(bool);
    };

    const { setIsReconnecting } = useContext(GeneralContext);

    useEffect(() => {
        subscribeToWebSocket("chatterbox", setIsReconnecting);

        receiveLatestMessages(data => {
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

        receiveAllMobileNumbers(data => {
            setRecipientsList(data);
        });

        return () => removeReceiveLatestMessages();
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

                            {
                                message_collection.inbox === null ? (
                                    <div style={{ width: "100%" }}><ListLoader /></div>
                                ) : (
                                    <MessageList
                                        width={width}
                                        url={url}
                                        messagesArr={message_collection.inbox}
                                        async
                                        hidden={chosen_tab !== 0}
                                        is_desktop={is_desktop}
                                    />
                                )
                            }

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

                            {
                                message_collection.unsent === null ? (
                                    <div style={{ width: "100%" }}><ListLoader /></div>
                                ) : (
                                    <MessageList
                                        width={width}
                                        url={url}
                                        messagesArr={message_collection.unsent}
                                        async
                                        hidden={chosen_tab !== 1}
                                        is_desktop={is_desktop}
                                    />
                                )
                            }

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
                            recipientsList={recipients_list}
                        />

                        <SearchMessageModal 
                            modalStateHandler={set_modal_fn("search", false)}
                            modalState={is_open_search_modal}
                            setSearchResultsToEmpty={() => setSearchResults([])}
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
                    url={url}
                    width={width}
                    is_desktop={is_desktop}
                    searchResults={search_results}
                    setSearchResults={setSearchResults}
                    ListLoader={ListLoader}
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
