import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
import { IconButton, Typography, Divider } from "@material-ui/core";
import { KeyboardArrowLeft } from "@material-ui/icons";
import ChatThread from "./ChatThread";
import GeneralStyles from "../../../GeneralStyles";
import MessageInputTextbox from "./MessageInputTextbox";
import { sample_single_convo } from "../../../store";

const styles = theme => {
    const gen_style = GeneralStyles(theme);
    
    return {
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
        sticky: {
            position: "sticky",
            top: 56,
            [theme.breakpoints.up("sm")]: {
                top: 63
            },
            [theme.breakpoints.up("md")]: {
                top: 118
            },
            backgroundColor: "white",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            zIndex: 3
        },
        chatHead: {
            paddingLeft: 8,
            [theme.breakpoints.up("md")]: {
                paddingLeft: 0
            },
            display: "flex",
            alignItems: "center"
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
};

function recipientsFormatter (recipients) {
    let line;
    if (recipients.length === 1) {
        const [recipient] = recipients;
        const {
            first_name, last_name, organizations,
            mobile_numbers
        } = recipient;

        const [mobile] = mobile_numbers;

        line = <Fragment>
            <div>
                { `${organizationExtractor(organizations)} ${first_name} ${last_name}` }
            </div>
            <Typography variant="caption" color="textSecondary">
                { `+${mobile.sim_num}` }
            </Typography>
        </Fragment>;
    }

    return <Typography variant="subtitle2">
        {line}
    </Typography>;
}

function organizationExtractor (organizations) {
    const [org] = organizations;
    const { org_name, site } = org;
    const { length } = organizations;
    let site_identifier = "";
    
    if (org_name === "plgu" && length > 1) site_identifier = site.province;
    else if (org_name === "mlgu" && length > 1) site_identifier = site.municipality;
    else site_identifier = site.site_code.toUpperCase();

    return `${site_identifier} ${org_name.toUpperCase()}`;
}

const goBack = (history, backHandler) => e => {
    e.preventDefault();
    backHandler();
    history.goBack();
};

class ConversationWindow extends Component {
    state = {
        recipients: [],
        message: null,
        message_list: []
    }

    componentDidMount () {
        const json = sample_single_convo;
        const { state } = this.props.location;

        if (state === undefined) {
            console.info("--- Fresh data aka not came from link (e.g. search)");
        } else console.info("--- Data from link (e.g. search)", state);
        
        this.setState({
            recipients: json.recipients,
            message_list: json.data
        });

        this.scrollToBottom();
    }

    componentDidUpdate () {
        this.scrollToBottom();
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView();
    }

    render () {
        const { classes, history, backHandler } = this.props;
        const { recipients, message_list } = this.state;

        return (
            <Fragment>
                {/* <div className={classes.sticky}> */}
                <div className={`${classes.regularContainer} ${classes.sticky}`}>
                    <div className={classes.chatHead}>
                        <IconButton
                            aria-label="Back"
                            color="primary"
                            className={classes.backButton}
                            onClick={goBack(history, backHandler)}
                        >
                            <KeyboardArrowLeft className={classes.backIcon} />
                        </IconButton>

                        { (recipients.length > 0) && recipientsFormatter(recipients) }
                    </div>
                </div>

                <div className={classes.regularContainer}>
                    <ChatThread message_list={message_list}/>
                </div>

                <Divider className={classes.divider}/>

                <div className={classes.chatInputContainer}>
                    <MessageInputTextbox />
                </div>

                <div style={{ "float": "left", clear: "both" }}
                    ref={(el) => { this.messagesEnd = el; }} />
            </Fragment>
        );
    }
}

export default withStyles(styles)(ConversationWindow);
