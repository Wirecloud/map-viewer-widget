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
        var lat;
        var lng;

        this.poi = poi;

        if (poi.location == null && poi.currentLocation && poi.currentLocation.lat && poi.currentLocation.lng) {
            // Convert deprecated currentLocation attribute to the new location attribute
            lat = parseFloat(poi.currentLocation.lat);
            lng = parseFloat(poi.currentLocation.lng);

            this.poi.location = {
                "type": "Point"
            };

            if (poi.currentLocation.system == "UTM") {
                var tmp = utm2decimal(lat, lng);
                lat = tmp.lat;
                lng = tmp.lng;
            }
            this.poi.location.coordinates = [lat, lng];
        }
    };

    Poi.prototype.getId = function getId() {
        return this.poi.id;
    };

    Poi.prototype.getIcon = function getIcon() {
        return this.poi.icon;
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

    window.Poi = Poi;
})();
