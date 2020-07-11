import React, { useRef, createRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { Map as LeafletMap, TileLayer, Popup, CircleMarker } from "react-leaflet";
import { prepareSiteAddress } from "../../../UtilityFunctions";

function PhilippineMap (props) {
    const { siteMapData, hoveredSite, url } = props;
    const latitude = 12.8797;
    const longitude = 121.7740;
    const position = [latitude, longitude];
    const zoom = 5;

    const refs = useRef(siteMapData.map(() => createRef()));
    useEffect(() => {
        if (hoveredSite !== null) {
            const i = siteMapData.findIndex(x => x.site_code === hoveredSite);
            const ref = refs.current[i].current;
            if (ref !== null) ref.leafletElement.openPopup();
        }
    }, [hoveredSite]);

    return (
        <LeafletMap style={{ height: "75vh" }} center={position} zoom={zoom} scrollWheelZoom="center">
            <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                id="mapbox.streets"
                url="https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
            />
            {
                siteMapData.map((site, i) => {
                    const { site_code } = site;
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
                            ref={refs.current[i]}
                        >
                            <Popup>
                                <Link to={`${url}/${site_code}`} style={{ color: "black" }}>
                                    <strong>{site_code.toUpperCase()}</strong> <br/>
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
