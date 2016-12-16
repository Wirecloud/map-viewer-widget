/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the map-viewer widget.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *          http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

/* global window Coordinates */

(function () {

    "use strict";

    /** ***************************************************/
    /** ******************* PUBLIC ************************/
    /** ***************************************************/

    var Poi = function Poi(poi) {
        this.poi = {
            id: "",
            currentLocation: {      // Current Location.
                system: "",         // geodetic datum system (usually WGS84, it can be UTM)
                lat: "",            // Latitude in geodetic datum system
                lng: ""             // Longitude in geodetic datum system
            },
            icon: "",
            tooltip: "",
            data: {}
        };
/*      this.poi = {
            id: "tec33",
            currentLocation: {
                system: "WGS84",
                lat: "40.123",
                lng: "-54.1"
            },
            icon: "http://example.org/images/image.png",
            tooltip: "Pending Issues: 0",
            infoWindow: "<div>some HTML code</div>",
            data: {}
        };*/
        this.coordinates = {
            utm: {
                lat: 0,
                lng: 0
            },
            decimal: {
                lat: 0,
                lng: 0
            }
        };

        this.init(poi);
    };

    Poi.prototype.init = function init(poi) {
        var lat;
        var lng;

        this.poi = poi;

        if (poi.currentLocation && poi.currentLocation.lat && poi.currentLocation.lng) {
            lat = parseFloat(poi.currentLocation.lat);
            lng = parseFloat(poi.currentLocation.lng);
            if (poi.currentLocation.system == "UTM") {
                this.coordinates.utm.lat = lat;
                this.coordinates.utm.lng = lng;
                this.coordinates.decimal = utm2decimal(lat, lng);
            } else if (poi.currentLocation.system == "WGS84" || poi.currentLocation.system === "") {
                this.coordinates.decimal.lat = lat;
                this.coordinates.decimal.lng = lng;
                this.coordinates.utm = decimal2utm(lat, lng);
            }
        }
    };

    Poi.prototype.getId = function getId() {
        return this.poi.id;
    };

    Poi.prototype.getIcon = function getIcon() {
        return this.poi.icon;
    };

    Poi.prototype.getUtmCoords = function getUtmCoords() {
        return this.coordinates.utm;
    };

    Poi.prototype.getDecimalCoords = function getDecimalCoords() {
        return this.coordinates.decimal;
    };

    Poi.prototype.getTooltip = function getToolTip() {
        return this.poi.tooltip;
    };

    Poi.prototype.getData = function getData() {
        return this.poi.data;
    };

    Poi.prototype.getInfoWindow = function getInfoWindow() {
        return this.poi.infoWindow;
    };

    /** ***************************************************/
    /** ****************** PRIVATE ************************/
    /** ***************************************************/

    /*  utm2decimal: Transform utm coordinates to decimal coordinates.
     *      - Parameters:
     *          - utmLat: Latitude. A number.
     *          - utmLng: Longitude. A number.
     *      - Return: decimal coordinates in latLng object. Example: {lat; 26.54, lng: 32.123}
     * */
    var utm2decimal = function utm2decimal(utmLat, utmLng) {
        var coordinates = new Coordinates();
        var decimalCoords = [];
        var southhemi = utmLat < 0 ? true : false;

        coordinates.utmToGeoDeg(utmLat, utmLng, southhemi, decimalCoords);

        return {
            lat: decimalCoords[0],
            lng: decimalCoords[1]
        };
    };

    /*  decimal2utm: Transform decimal coordinates to utm coordinates.
     *      - Parameters:
     *          - decLat: Latitude. A number.
     *          - decLng: Longitude. A number.
     *      - Return: utm coordinates in latLng object. Example: {lat; 2654, lng: 32123}
     * */
    var decimal2utm = function decimal2utm(decLat, decLng) {
        var coordinates = new Coordinates();
        var utmCoords = [];

        coordinates.geoDegToUTM(decLat, decLng, false, utmCoords);

        return {
            lat: utmCoords[0],
            lng: utmCoords[1]
        };
    };

    window.Poi = Poi;
})();
