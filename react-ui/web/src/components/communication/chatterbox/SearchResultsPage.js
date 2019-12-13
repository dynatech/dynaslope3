import React, {
    Fragment, useState, useEffect,
    useRef
} from "react";

import { 
    IconButton, Typography, Divider,
    withStyles, Grid, Chip,
    Avatar, makeStyles, Button
} from "@material-ui/core";
import { ArrowBackIos } from "@material-ui/icons";

import ContentLoader from "react-content-loader";

import { isWidthUp } from "@material-ui/core/withWidth";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
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

const AvatarWithText = () => (
    <ContentLoader 
        height={70}
        width={800}
        speed={2}
        primaryColor="#f3f3f3"
        secondaryColor="#ecebeb"
        preserveAspectRatio="xMinYMin slice"
    >
        <rect x="69" y="7" rx="4" ry="4" width="663" height="19" /> 
        <rect x="70" y="35" rx="3" ry="3" width="293" height="14" /> 
        <rect x="0" y="120" rx="3" ry="3" width="201" height="6" /> 
        <circle cx="30" cy="30" r="30" />
    </ContentLoader>
);

const ChatLoader = props => {
    return (
        <ContentLoader
            height={160}
            width={446}
            speed={2}
            primaryColor="#f3f3f3"
            secondaryColor="#ecebeb"
        >
            <circle cx="19" cy="25" r="16" />
            <rect x="39" y="12" rx="5" ry="5" width="220" height="10" />
            <rect x="40" y="29" rx="5" ry="5" width="220" height="10" />
            <circle cx="420" cy="71" r="16" />
            <rect x="179" y="76" rx="5" ry="5" width="220" height="10" />
            <rect x="179" y="58" rx="5" ry="5" width="220" height="10" />
            <circle cx="21" cy="117" r="16" />
            <rect x="45" y="104" rx="5" ry="5" width="220" height="10" />
            <rect x="45" y="122" rx="5" ry="5" width="220" height="10" />
        </ContentLoader>
    );
};
  
const goBack = history => e => {
    e.preventDefault();
    history.goBack();
};

function BackToMainButton (props) {
    const { width, history } = props;

    return (
        isWidthUp(width, "sm") ? (<Button
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
        location,
        messageCollection, socket
    } = props;
    const classes = useStyles();
    const { state: {
        sites, organizations 
    } } = location;
    // console.log("message_collection", messageCollection);

    const [is_loading, setIsLoading] = useState(false);

    const has_no_input = sites.length === 0 && organizations.length === 0;

    useEffect(() => {
        setIsLoading(true);

        if (!has_no_input) {
            const input = {
                site_ids: sites.map(s => s.value),
                org_ids: sites.map(o => o.value)
            };

            console.log(input, socket);

            if (typeof socket !== "undefined") {
                socket.emit("get_search_results", input);
    
                receiveSearchResults(data => {
                    console.log(data);
                });
            }
        }

        return () => {
            if (typeof socket !== "undefined") {
                removeReceiveSearchResults();
            }
        };
    }, [socket, sites, organizations]);

    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | Chatterbox"
            />

            <Divider style={{ marginBottom: 24 }} />

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



        </div>
    );
}

export default SearchResultsPage;
