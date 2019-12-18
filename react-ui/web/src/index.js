import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { SnackbarProvider } from "notistack";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

function noop () {}

if (process.env.NODE_ENV !== "development") {
    console.log = noop;
    console.warn = noop;
    console.error = noop;
}

ReactDOM.render(
    <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
        }}
    >
        <App />
    </SnackbarProvider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
