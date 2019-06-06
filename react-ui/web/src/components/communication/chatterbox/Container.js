import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Grid, Divider } from "@material-ui/core";
import { Route } from "react-router-dom";
import GeneralStyles from "../../../GeneralStyles";
import PageTitle from "../../reusables/PageTitle";
import MessageList from "./MessageList";
import ConversationWindow from "./ConversationWindow";

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


class Container extends Component {
    state = {
        chosen_tab: 0,
        has_chosen_message: false
    }

    changeState = (key, value) => {
        this.setState({ [key]: value });
    };

    handleBoolean = (key, value) => () => {
        this.changeState(key, value);
    }

    render () {
        const { classes, match: { url } } = this.props;
        const { chosen_tab, has_chosen_message } = this.state;

        return (
            <Fragment>
                <div className={classes.pageContentMargin}>
                    <PageTitle title="Communications | Chatterbox" />
                </div>

                <Divider />

                { !has_chosen_message && (<Grid container>
                    <Grid item xs={12}>
                        <MessageList url={url} clickHandler={this.handleBoolean("has_chosen_message", true)} />
                    </Grid>
                </Grid>)
                }

                <Route path={`${url}/:id`} render={
                    props => <ConversationWindow 
                        {...props} 
                        backHandler={this.handleBoolean("has_chosen_message", false)} 
                    />} 
                />
            </Fragment>
        );
    }
}

export default withStyles(styles)(Container);
