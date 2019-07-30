import React, { Component } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as LeafletMap, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerIcon from "leaflet/dist/images/marker-icon.png";
import ShadowIcon from "leaflet/dist/images/marker-shadow.png";
import RetinaIcon from "leaflet/dist/images/marker-icon-2x.png";

const marker = L.icon({
    iconUrl: MarkerIcon,
    shadowUrl: ShadowIcon,
    iconRetinaUrl: RetinaIcon,
    iconSize: [25, 41], // size of the icon
    shadowSize: [41, 41], // size of the shadow
    iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
    shadowAnchor: [12, 41], // the same for the shadow
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    tooltipAnchor: [16, -28]
});

class EarthquakeMap extends Component {
    // componentDidMount () {
    //     this.map = L.map("map", {
    //         center: [58, 16],
    //         zoom: 6,
    //         zoomControl: false
    //     });

    //     L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    //         attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    //         maxZoom: 18,
    //         maxNativeZoom: 17,
    //         detectRetina: true,
    //         id: "mapbox.streets",
    //         accessToken: "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
    //     }).addTo(this.map);

    //     L.marker([51.5, -0.09], { icon: marker }).addTo(this.map);
    // }

    // render () {
    //     return <div id="map" style={{ width: 600, height: 800 }} />;
    // }

    constructor () {
        super();
        this.state = {
            lat: 12.8797,
            lng: 121.7740,
            zoom: 5
        };
    }
    
    render () {
        const position = [this.state.lat, this.state.lng];

        return (
            <LeafletMap style={{ height: 500 }} center={position} zoom={this.state.zoom}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />
                <Marker icon={marker} position={position}>
                    <Popup>
                        A pretty CSS3 popup. <br/> Easily customizable.
                    </Popup>
                </Marker>
            </LeafletMap>
        );
    }
}

export default EarthquakeMap;
