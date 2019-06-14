import io from "socket.io-client";

let socket;
let socket2;

function subscribeToWebSocket(cb) {
    // socket = io("http://127.0.0.1:5000/monitoring");
    socket = io("http://192.168.150.173:5000/monitoring");
    socket.on("receive_generated_alerts", (data) => cb(null, data));
    socket2 = io("http://192.168.150.173:5000");
}

function unsubscribeToWebSocket() {
    socket.close();
    socket2.close();
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
