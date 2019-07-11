import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { withStyles } from "@material-ui/core";
import { Header, Footer, Navigation } from "./components/layouts";
import RoutesCollection from "./Routes";

const styles = theme => ({
    app: {
        height: "100vh",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
    },
    body: { // Margin to accomodate sticky nature of header and navigation
        marginTop: 60,
        [theme.breakpoints.up("sm")]: {
            marginTop: 70
        },
        [theme.breakpoints.up("md")]: {
            marginTop: 124
        }
    }
});

class App extends Component {
    state = {
        drawer: false
    }

    toggleDrawer = (isOpen) => () => {
        this.setState({
            drawer: isOpen,
        });
    };
  
    render () {
        const { classes } = this.props;
        const { drawer } = this.state;

        return (
            <BrowserRouter >
                <Header drawerHandler={this.toggleDrawer}/>
                <Navigation
                    drawerHandler={this.toggleDrawer}
                    drawer={drawer}
                />
                <div className={classes.app}>
                    <div className={classes.body}>
                        <RoutesCollection />
                        {/* <Route path="/" component={RoutesCollection} /> */}
                    </div>
                
                    <Footer />
                </div>
            </BrowserRouter>
        );
    }
}

// const App = () => (
//     <Fragment>
//         <Header />
//         <Container />
//         <Footer />
//     </Fragment>
// );

export default withStyles(styles)(App);
