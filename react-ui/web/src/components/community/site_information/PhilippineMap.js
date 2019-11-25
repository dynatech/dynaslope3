import React, { useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as LeafletMap, TileLayer, Popup, CircleMarker } from "react-leaflet";
import { prepareSiteAddress } from "../../../UtilityFunctions";

function PhilippineMap (props) {
    const { zoomIn, siteMapData } = props;
    const [latitude, setLatitude] = useState(12.8797);
    const [longitude, setLongitude] = useState(121.7740);
    const [position, setPosition] = useState([latitude, longitude]);
    const [zoom, setZoom] = useState(6);

    return (
        <LeafletMap style={{ height: 700 }} center={position} zoom={zoom}>
            <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                id="mapbox.streets"
                url="https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
            />
            {
                siteMapData.map(site => {
                    const { url, onClickHandler } = site;
                    // console.log(site);
                    return (
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
                                <Link to={url} style={{ textDecoration: "none", color: "black" }} onClick={ret => onClickHandler}>
                                    <strong>{site.site_code.toUpperCase()}</strong> <br/>
                                    {prepareSiteAddress(site, false)}
                                </Link>
                            </Popup>
                        </CircleMarker>
                    );
                })
            }

            
            {/* <Marker icon={marker} position={position}>
                <Popup>
                    A pretty CSS3 popup. <br/> Easily customizable.
                </Popup>
            </Marker> */}
        </LeafletMap>
    );
}

export default PhilippineMap;
