import React, { Component } from "react";
import { BrowserRouter } from "react-router-dom";
import { Header, Footer, Navigation } from "./components/layouts";
import RoutesCollection from "./Routes";

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
        const { drawer } = this.state;

        return (
            <BrowserRouter>
                <Header drawerHandler={this.toggleDrawer}/>
                <Navigation drawerHandler={this.toggleDrawer} drawer={drawer}/>
                
                <RoutesCollection />
                
                <Footer />
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

export default App;
