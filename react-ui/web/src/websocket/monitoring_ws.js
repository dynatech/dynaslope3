import io from "socket.io-client";
import { host } from "../config";

let socket;

// function subscribeToWebSocket(keyword, callback) {
//     socket = io("http://127.0.0.1:5000/monitoring");
//     if (keyword === "generated_alerts") {
//         socket.on("receive_generated_alerts", data => callback(null, data));
//     } else if (keyword === "candidate_alerts") {
//         socket.on("receive_candidate_alerts", data => callback(null, data));
//     }
// }

export function subscribeToWebSocket (socket_fns) {
    socket = io(`${host}/monitoring`);
    socket.on("receive_generated_alerts", data => socket_fns.receive_generated_alerts(null, data));
    socket.on("receive_candidate_alerts", data => socket_fns.receive_candidate_alerts(null, data));
    socket.on("receive_alerts_from_db", data => socket_fns.receive_alerts_from_db(null, data));
}


export function sendWSMessage (key, data) {
    console.log("KEY:", key);
    console.log("DATA:", data);
    const payload = {
        data,
        key
    };
    socket.send(payload);
}


export function onWSMessage (message) {
    socket.on("message", (msg) => {
        console.log(msg);
    });
}

export function unsubscribeToWebSocket () {
    socket.close();
}

// // Note: Sample implem on "functional components" using Hooks
// const [data, setData] = useState(null);
//     useEffect(() => {
//         subscribeToTimer((err, d) => {
//             setData(d);
//         });

//         return () => {
//             console.log("unmount this");
//             setData(null);
//             unsubscribeToTimer();
//         };
//     }, []);
