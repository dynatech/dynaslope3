import React, { 
    Fragment, useRef, createRef, 
    useState, useEffect 
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as LeafletMap, TileLayer, Marker, Popup, Circle, CircleMarker } from "react-leaflet";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import ShadowIcon from "leaflet/dist/images/marker-shadow.png";
import RetinaIcon from "leaflet/dist/images/marker-icon-2x.png";
import { sites } from "../../../store";
import { prepareSiteAddress } from "../../../UtilityFunctions";

const marker = L.icon({
    iconUrl: MarkerIcon,
    shadowUrl: ShadowIcon,
    iconRetinaUrl: RetinaIcon,
    iconSize: [25, 41],
    // [18, 31], // [25, 41], // size of the icon
    shadowSize: [41, 41],
    // [31, 31], // [41, 41], // size of the shadow
    iconAnchor: [12, 41],
    // [12, 31], // [12, 41], // point of the icon which will correspond to marker's location
    shadowAnchor: [12, 41],
    // [12, 31], // [12, 41], // the same for the shadow
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    tooltipAnchor: [16, -28]
});

function EarthquakeMap (props) {
    const { eqEvents, zoomIn } = props;

    const state = {
        lat: 12.8797,
        lng: 121.7740,
        zoom: 5
    };

    let position = [state.lat, state.lng];
    let { zoom } = state;
    if (zoomIn) {
        const { latitude, longitude } = eqEvents[0];
        position = [latitude, longitude];
        zoom = 7;
    }

    
    const ref = useRef();
    const is_one = eqEvents.length === 1;
    const [show_popup, setShowPopUp] = useState(false);
    useEffect(() => {
        if (is_one) setShowPopUp(true);
    }, [eqEvents]);

    useEffect(() => {
        if (show_popup) {
            if (ref !== null) ref.current.leafletElement.openPopup();
            setShowPopUp(false);
        }
    }, [show_popup]);

    const rule = /\.0*$|(?<=\.[0-9]{0,2147483646})0*$/;

    return (
        <LeafletMap style={{ height: 465 }} center={position} zoom={zoom}>
            <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                id="mapbox.streets"
                url="https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
            />
            {
                eqEvents.map((event, i) => {
                    const {
                        latitude, longitude, magnitude,
                        depth, critical_distance, eq_id, processed
                    } = event;
                    const center = [latitude, longitude];
                    const distance = critical_distance === null ? 0 : parseFloat(critical_distance);

                    return (
                        <Fragment key={eq_id}>
                            <Circle center={center} fillColor="blue" radius={distance * 1000} />
                            <Marker icon={marker} position={center} ref={is_one ? ref : createRef()}>
                                <Popup>
                                    Magnitude: <strong>{magnitude.replace(rule, "")}</strong> <br/>
                                    Depth: <strong>{depth.replace(rule, "")}</strong> <br/>
                                    Critical Distance: <strong>{distance} km</strong> <br/>
                                    Processed: <strong>{processed ? "Yes" : "No"}</strong>
                                </Popup>
                            </Marker>
                        </Fragment>
                    );
                })
            }

            {
                sites.map(site => (
                    <CircleMarker
                        key={site.site_id}
                        center={[site.latitude, site.longitude]}
                        fillColor="green"
                        fillOpacity={1}
                        color="black"
                        weight={1}
                        radius={4}
                        bringToFront
                    >
                        <Popup>
                            <strong>{site.site_code.toUpperCase()}</strong> <br/>
                            {prepareSiteAddress(site, false)}
                        </Popup>
                    </CircleMarker>
                ))
            }

            {/* <Marker icon={marker} position={position}>
                <Popup>
                    A pretty CSS3 popup. <br/> Easily customizable.
                </Popup>
            </Marker> */}
        </LeafletMap>
    );
}

export default EarthquakeMap;
