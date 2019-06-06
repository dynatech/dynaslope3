import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { AppBar, Tabs, Tab, NoSsr } from "@material-ui/core";

const preventDefault = event => {
    event.preventDefault();
};

function LinkTab (props) {
    return <Tab component="a" onClick={preventDefault} {...props} />;
}

const styles = theme => ({
    root: {
        flexGrow: 1
    },
});

function TabBar (props) {
    const { chosenTab, onSelect, tabsArray, classes } = props;

    const onIndexSelect = (e, i) => {
        onSelect(i);
    };

    return (
        <NoSsr>
            <div>
                <AppBar position="static" color="default" className={classes.root}>
                    <Tabs 
                        variant="fullWidth"
                        value={chosenTab}
                        onChange={onIndexSelect}
                    >
                        {
                            tabsArray.map(tab => {
                                const { label, href } = tab;
                                return (
                                    <LinkTab label={label} href={href} key={href} />
                                );
                            })
                        }
                    </Tabs>
                </AppBar>
            </div>
        </NoSsr>
    );
}

export default withStyles(styles)(TabBar);