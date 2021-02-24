import React, {
    useState, useEffect, Fragment
} from "react";

import { 
    IconButton, Typography,
    makeStyles, Button, Box,
    Grid, Hidden, Divider
} from "@material-ui/core";
import { ArrowBackIos, NavigateNext, NavigateBefore} from "@material-ui/icons";
import { isWidthDown } from "@material-ui/core/withWidth";

import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";

import { receiveSearchResults, removeReceiveSearchResults } from "../../../websocket/communications_ws";
import { capitalizeFirstLetter } from "../../../UtilityFunctions";

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
        sites, organizations, only_ewi_recipients,
        include_inactive_numbers, ts_start, ts_end,
        string_search, tag_search,
        mobile_number_search, name_search
    } } = location;

    const [is_loading, setIsLoading] = useState(false);
    const has_no_input = sites === null && organizations === null;
    const has_string_or_tag = string_search !== "" || tag_search.label !== "";
    const offset = 0;
    const [updated_offset, setUpdateOffset] = useState(offset);

    const previousButtonHandler = () => {
        if(updated_offset > 0){
            const temp_offset = updated_offset - 20;
            setUpdateOffset(temp_offset);
        }
    };
    
    const nextButtonHandler = () => {
        const temp_offset = updated_offset + 20;
        setUpdateOffset(temp_offset);
    };

    useEffect(() => {
        const has_no_search_results = searchResults.length === 0;
        if (!has_no_input && has_no_search_results || has_string_or_tag) {
            setIsLoading(true);
            
            const input = {
                site_ids: sites.map(s => s.value),
                org_ids: organizations.map(o => o.value),
                only_ewi_recipients,
                include_inactive_numbers,
                ts_start,
                ts_end,
                string_search,
                tag_search: tag_search.label,
                mobile_number_search,
                name_search,
                updated_offset
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
    }, [
        socket, sites, organizations,
        ts_start, ts_end, updated_offset
    ]);

    return (
        <div className={classes.pageContentMargin}>
            <PageTitle
                title="Communications | Chatterbox"
            />

            <Grid container>
                <div><BackToMainButton {...props}/></div>

                <Hidden smDown>
                    <Grid item xs={12} style={{ marginBottom: 12 }} />
                </Hidden>

                <Typography
                    component={Grid} item xs
                    variant="h5"
                >
                    Search Results
                </Typography>

                <Hidden smUp>
                    <Grid item xs={12} style={{ marginBottom: 8 }} />
                </Hidden>
            </Grid>

            <Box display="flex" flexWrap="wrap">
                {
                    sites.length !== 0 && <Box mr={2}>
                        <Typography variant="subtitle2">
                            <strong>Site(s):</strong> { sites.map(x => x.data.site_code.toUpperCase()).join(", ") }
                        </Typography>
                    </Box>
                }

                {
                    organizations.length !== 0 && <Box mr={2}>
                        <Typography variant="subtitle2">
                            <strong>Organizations(s):</strong> { organizations.map(x => x.label).join(", ") }
                        </Typography>
                    </Box>
                }

                {
                    ts_start && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>Start Date/Time:</strong>{ts_start}</Typography>
                    </Box>
                }

                {
                    ts_end && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>End Date/Time:</strong>{ts_end}</Typography>
                    </Box>
                }

                {
                    string_search && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>String: </strong>{string_search}</Typography>
                    </Box>
                }

                {
                    tag_search.label && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>Tag: </strong>{tag_search.label}</Typography>
                    </Box>
                }

                {
                    mobile_number_search && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>Mobile Number: </strong>{mobile_number_search}</Typography>
                    </Box>
                }

                {
                    name_search. length != 0 && <Box mr={2}>
                        <Typography variant="subtitle2"><strong>Has name search</strong></Typography>
                    </Box>
                }

                <Box mr={2}>
                    <Typography variant="subtitle2">
                        <strong>Only EWI Recipients:</strong> {capitalizeFirstLetter(only_ewi_recipients.toString())}
                    </Typography>
                </Box>

                <Box mr={2}>
                    <Typography variant="subtitle2">
                        <strong>Include Invalid Numbers:</strong> {capitalizeFirstLetter(include_inactive_numbers.toString())}
                    </Typography>
                </Box>
            </Box>
            
            <Divider style={{ marginTop: 12 }} />
            {
                searchResults.length > 0 && has_string_or_tag && (
                    <Box display="flex" flexDirection="row-reverse">
                        <Button
                            size="small"
                            style={{ margin: 10 }}
                            onClick={nextButtonHandler}
                            variant="contained"
                            color="primary"
                            endIcon={<NavigateNext />}
                        > Next </Button>
                        <Button
                            size="small"
                            style={{ margin: 10 }}
                            onClick={previousButtonHandler}
                            variant="contained"
                            color="primary"
                            startIcon={<NavigateBefore />}
                        > Previous </Button>
                    </Box>
                )
            }
            
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
                            searchFilters={{ ts_start, ts_end }}
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
