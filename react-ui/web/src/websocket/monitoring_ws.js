import io from "socket.io-client";

let socket;
let socket2;

function subscribeToTimer (cb) {
    // socket = io("http://127.0.0.1:5000/monitoring");
    socket = io("http://192.168.150.173:5000/monitoring");
    socket.on("receive_generated_alerts", (data) => cb(null, data));
    socket.emit("get_generated_alerts", 1000);
}

function unsubscribeToTimer () {
    socket.close();
}

export { subscribeToTimer, unsubscribeToTimer };


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
