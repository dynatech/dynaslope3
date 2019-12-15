import React, {
    useState, useEffect,

} from "react";

import { 
    IconButton, Typography, Divider,
    makeStyles, Button
} from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";

import { isWidthDown } from "@material-ui/core/withWidth";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";

import { receiveSearchResults, removeReceiveSearchResults } from "../../../websocket/communications_ws";

const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
        ...gen_style,
        regularContainer: {
            ...gen_style.pageContentMargin,
            margin: 0,
            padding: "16px 0"
        },
        chatInputContainer: {
            ...gen_style.pageContentMargin
        },
        divider: {
            ...gen_style.pageContentMargin,
            margin: 0
        },
        backButton: {
            padding: 0,
            marginRight: 12
        },
        backIcon: {
            width: 40,
            height: 40
        }
    };
});
  
const goBack = history => e => {
    e.preventDefault();
    history.goBack();
};

function BackToMainButton (props) {
    const { width, history } = props;

    return (
        isWidthDown(width, "sm") ? (<Button
            variant="contained"
            color="primary"
            size="small" 
            onClick={goBack(history)}
            startIcon={<ArrowBackIos />}
        >
            Back to conversation list
        </Button>) : (<IconButton
            variant="contained"
            color="primary"
            size="small" 
            onClick={goBack(history)}
        >
            <ArrowBackIos />
        </IconButton>)
    );
}

function SearchResultsPage (props) {
    const {
        location, socket, width,
        url, is_desktop,
        searchResults, setSearchResults,
        ListLoader
    } = props;
    const classes = useStyles();
    const { state: {
        sites, organizations
    } } = location;

    const [is_loading, setIsLoading] = useState(false);
    // const [search_results, setSearchResults] = useState([]);

    const has_no_input = sites === null && organizations === null;

    useEffect(() => {
        const has_no_search_results = searchResults.length === 0;

        if (!has_no_input && has_no_search_results) {
            setIsLoading(true);

            const input = {
                site_ids: sites.map(s => s.value),
                org_ids: organizations.map(o => o.value)
            };

            if (typeof socket !== "undefined") {
                socket.emit("get_search_results", input);
    
                receiveSearchResults(data => {
                    setIsLoading(false);
                    setSearchResults(data);
                });
            }
        }

        return () => {
            if (typeof socket !== "undefined") {
                removeReceiveSearchResults();
            }
        };
    }, [socket, searchResults, sites, organizations]);

    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | Chatterbox"
            />

            {/* <Divider style={{ marginBottom: 24 }} /> */}

            <BackToMainButton {...props} />

            <Typography variant="h5" style={{ marginTop: 24 }}>
                SEARCH RESULTS
            </Typography>

            {
                has_no_input && (
                    <Typography variant="h6" align="center">
                        <strong>No search input</strong>
                    </Typography>
                )
            }

            {
                // eslint-disable-next-line no-nested-ternary
                is_loading ? (
                    <div style={{ width: "100%" }}>
                        <ListLoader />
                    </div>
                ) : (
                    searchResults.length > 0 ? (
                        <MessageList
                            width={width}
                            url={url}
                            messagesArr={searchResults}
                            async
                            hidden={false}
                            is_desktop={is_desktop}
                        />
                    ) : (
                        <Typography variant="h6" align="center">
                            <strong>No results found</strong>
                        </Typography>
                    )
                )
            }
        </div>
    );
}

export default SearchResultsPage;
