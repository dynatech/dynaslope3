import io from "socket.io-client";

let socket;

function subscribeToWebSocket(cb) {
    socket = io("http://127.0.0.1:5000/monitoring");
    socket.on("receive_generated_alerts", (data) => cb(null, data));
}

function unsubscribeToWebSocket() {
    socket.close();
}

export { subscribeToWebSocket, unsubscribeToWebSocket };

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
