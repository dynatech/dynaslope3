import React, {
    Fragment, useState,
    useEffect, useContext
} from "react";
import { Route, Switch } from "react-router-dom";

import { 
    Button, Badge, makeStyles, IconButton,
    Dialog, DialogTitle, DialogContent, Typography, Divider
} from "@material-ui/core";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { Create, Search, Info } from "@material-ui/icons";

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

import { CommsProvider } from "./CommsContext";
import { GeneralContext } from "../../contexts/GeneralContext";

import {
    socket, subscribeToWebSocket, removeReceiveLatestMessages,
    receiveAllMobileNumbers, receiveLatestMessages,
    removeReceiveAllMobileNumbers
} from "../../../websocket/communications_ws";
import { getAllTags } from "../ajax";

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
        speed={2}
        foregroundColor="#f3f3f3"
        backgroundColor="#ecebeb"
        viewBox="0 0 600 400"
        style={{ width: "100%" }}
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

function ChatterboxInfoModal (props) {
    const { modalState, modalStateHandler } = props;
    
    return (
        <Dialog onClose={modalStateHandler} aria-labelledby="simple-dialog-title" open={modalState}>
            <DialogTitle id="simple-dialog-title">Chatterbox Information</DialogTitle>
            <DialogContent>
                <Typography variant="h6" gutterBottom align="center">Inbox</Typography>
                <Typography variant="body1" gutterBottom align="justify">
                    &emsp;&emsp;Inbox tab contains the list of our contacts who recently sent a message to our server.
                    The first contact in the list is the most recent message sender, and so on.<br/><br/>
                    &emsp;&emsp;Unlike a regular message list on a messaging app, outbound messages to our contacts do not affect
                    the order of the list nor the appearance of a contact on the list (because our server sends
                    a lot of messages, especially when routine, that incoming messages might get unnoticed).
                </Typography>
                <Divider style={{ margin: "8px 0" }} />
                <Typography variant="h6" gutterBottom align="center">Unsent</Typography>
                <Typography variant="body1" gutterBottom align="justify">
                    &emsp;&emsp;Unsent tab displays conversation threads which contains unsent messages within one day span.
                    Unsent messages refer to messages in the process of sending or messages with failed sending attempt.
                </Typography>
            </DialogContent>
        </Dialog>
    );
}

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
        { label: "Unsent", href: "unsent" }
    ]);
    const [search_results, setSearchResults] = useState([]);
    const [recipients_list, setRecipientsList] = useState([]);
    const [tag_list, setTagList] = useState([]);

    const [is_open_info_modal, setIsOpenInfoModal] = useState(false);
    const set_modal_fn = (key, bool) => () => {
        if (key === "send") setIsOpenSendModal(bool);
        else if (key === "search") setIsOpenSearchModal(bool);
        else if (key === "info") setIsOpenInfoModal(bool);
    };

    const { setIsReconnecting } = useContext(GeneralContext);
    useEffect(() => {
        subscribeToWebSocket(setIsReconnecting, "chatterbox");
    }, [setIsReconnecting]);

    useEffect(() => {
        receiveLatestMessages(data => {
            setMessagesCollection(data);
            
            const { unsent: { length } } = data;
            let label = "Unsent";
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
            setTabsArray(prev => [...prev.slice(0, 1), { label, href: "unsent" }]);
        });

        return () => {
            removeReceiveLatestMessages();
        };
    }, []);

    useEffect(() => {
        receiveAllMobileNumbers(data => {
            setRecipientsList(data);
        });

        return () => {
            removeReceiveAllMobileNumbers();
        };
    }, []);

    useEffect(() => {
        getAllTags(all_tags => {
            const tags = all_tags.map(row => ({
                value: row.tag_id,
                label: `${row.tag} (${row.source.match(/sms(.*)_/)[1]})`,
                source: row.source
            }));

            setTagList(tags);
        });
    }, []);

    const is_desktop = isWidthUp("md", width);

    const custom_buttons = <span>
        <IconButton 
            color="primary"
            aria-label="Chatterbox info"
            onClick={set_modal_fn("info", true)}
        >
            <Info fontSize="large" />
        </IconButton>

        <Button
            aria-label="Compose message"
            variant="contained" 
            color="primary"
            size="small" 
            style={{ marginRight: 8 }}
            onClick={set_modal_fn("send", true)}
            startIcon={<Create/>}
        >
            Compose
        </Button>

        <Button 
            aria-label="Search messages"
            variant="contained"
            color="primary"
            size="small"
            onClick={set_modal_fn("search", true)}
            startIcon={<Search />}
        >
            Search
        </Button>
    </span>;

    return (
        <CommsProvider>
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
                                    message_collection.inbox === null ? (
                                        <ListLoader />
                                    ) : (
                                        <MessageList
                                            width={width}
                                            url={url}
                                            messagesArr={message_collection.inbox}
                                            hidden={chosen_tab !== 0}
                                            is_desktop={is_desktop}
                                        />
                                    )
                                }

                                {
                                    chosen_tab === 1 && (
                                        message_collection.unsent === null ? (
                                            <div style={{ width: "100%" }}><ListLoader /></div>
                                        ) : (
                                            <MessageList
                                                width={width}
                                                url={url}
                                                messagesArr={message_collection.unsent}
                                                hidden={chosen_tab !== 1}
                                                is_desktop={is_desktop}
                                            />
                                        )
                                    )
                                }
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
                                recipientsList={recipients_list}
                                tagList={tag_list}
                            />


                            <ChatterboxInfoModal
                                modalStateHandler={set_modal_fn("info", false)} 
                                modalState={is_open_info_modal}
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
                    /> } 
                />
            </Switch>
        </CommsProvider>
    );

}

export default withWidth()(Container);
