import { getSession, refreshSession as rS, loginUser } from "./ajax";

export function isLoggedIn (callback) {
    // const token = localStorage.getItem("access_token");
    const data = JSON.parse(localStorage.getItem("data"));
    
    if (data !== null) {
        const { tokens: { access_token, refresh_token } } = data;
        getSession(access_token, response => {
            // const { message, is_logged_in } = response;
            const { is_logged_in } = response;

            if (is_logged_in) {
                rS(refresh_token, res => {
                    data.tokens.access_token = res.access_token;
                    localStorage.setItem("data", JSON.stringify(data));
                });
            }

            callback(is_logged_in);
        });
    } else {
        // eslint-disable-next-line
        callback(false);
    }
}

export function refreshSession () {
    const data = JSON.parse(localStorage.getItem("data"));
    const { tokens: { refresh_token } } = data;

    rS(refresh_token, response => {
        data.tokens.access_token = response.access_token;
        localStorage.setItem("data", JSON.stringify(data));
    });
}

export function login (credentials, success_callback, failed_callback) {
    loginUser(credentials, response => {
        const { ok, message, data } = response;

        if (ok) {
            localStorage.setItem("data", JSON.stringify(data));
            success_callback(data);
        } else {
            failed_callback(message);
        }
    });
}
  
export function logout (callback) {
    localStorage.clear();
    callback();
}

export function getCurrentUser () {
    const data = JSON.parse(localStorage.getItem("data"));
    const { user } = data;

    return user;
}
// export function requiredAuth (nextState, replace) {
//     if (!isLoggedIn()) {
//         replace({
//             pathname: "/",
//             state: { nextPathname: nextState.location.pathname }
//         });
//     }
// }