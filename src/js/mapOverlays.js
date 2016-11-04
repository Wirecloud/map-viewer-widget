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

/*jshint browser:true*/
/*global google Poi*/

(function() {

    "use strict";

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var MapOverlay = function MapOverlay(map, markerClusterer, poi, radius) {

        if (!map || !poi || !radius) {
            throw new TypeError("Map, poi and radius parameters are required.");
        }

        this.map = map;
        this.markerClusterer = markerClusterer;
        this.overlaysDisplayed = false;

        this.poi = poi;
        this.circle = {};
        this.infoWindow = {};
        this.marker = {};
        
        this.radius = radius;
        this.contentInfoWindow = this.poi.getInfoWindow();
        this.position = this.poi.getDecimalCoords();
        this.icon = this.poi.getIcon();
        this.tooltip = this.poi.getTooltip();

        createElements.call(this);
        if (this.markerClusterer) {
            this.markerClusterer.addMarker(this.marker);
        }
        this.marker.setMap(this.map);
    };

    MapOverlay.prototype.updateRadius = function updateRadius (radius) {
        this.radius = radius;
        updateCircle.call(this);
    };

    MapOverlay.prototype.updatePoi = function updatePoi (poi) {
        this.poi = poi;

        this.contentInfoWindow = this.poi.getInfoWindow();
        this.position = this.poi.getDecimalCoords();
        this.icon = this.poi.getIcon();
        this.tooltip = this.poi.getTooltip();

        updateCircle.call(this);
        updateInfoWindow.call(this);
        updateMarker.call(this);
    };

    MapOverlay.prototype.setMarkerHandler = function setMarkerHandler (handler) {
        google.maps.event.clearInstanceListeners(this.marker);
        google.maps.event.addListener(this.marker, "click", handler);
    };

    MapOverlay.prototype.showOverlays = function showOverlays () {
        this.circle.setMap(this.map);
        this.infoWindow.open(this.map, this.marker);
        this.overlaysDisplayed = true;
    };

    MapOverlay.prototype.hideOverlays = function hideOverlays () {
        this.circle.setMap(null);
        this.infoWindow.close();
        this.overlaysDisplayed = false;
    };

    MapOverlay.prototype.destroy = function destroy () {
        this.hideOverlays();
        if (this.markerClusterer) {
            this.markerClusterer.removeMarker(this.marker);
        }
        this.marker.setMap(null);
        
    };

    MapOverlay.prototype.getPosition = function getPosition () {
        return this.position;
    };

/******************************************************************************/
/********************************* PRIVATE ************************************/
/******************************************************************************/


/*********************************** Add **************************************/

    var createElements = function createElements () {
        var googlePosition = new google.maps.LatLng(this.position.lat, this.position.lng);
        var options = {
            "circle": {
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                radius: this.radius,
                center: googlePosition,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.10
            },
            "infoWindow": {
                content: this.contentInfoWindow,
                position: googlePosition
            },
            "marker": {
                map: this.map,
                //animation: google.maps.Animation.DROP,
                position: googlePosition,
                title: this.tooltip,
                visible: true
            }
        };

        if (this.icon) {
            var iconSize = new google.maps.Size(40, 40);
            var markerImage = new google.maps.MarkerImage(this.icon, null, null, null, iconSize);
            options.marker.icon = markerImage;
        }

        for (var option in options) {
            createElement.call(this, option, options[option]);
        }
    };

    var createElement = function createElement (item, options) {
        var constructor = {
            "circle": "Circle",
            "infoWindow": "InfoWindow",
            "marker": "Marker"
        };

        this[item] = new google.maps[constructor[item]](options);
    };

/****************************** Update ***********************************/

    var updateCircle = function updateCircle () {
        var googlePosition = new google.maps.LatLng(this.position.lat, this.position.lng);
        this.circle.setRadius(this.radius);
        this.circle.setCenter(googlePosition);
    };

    var updateInfoWindow = function updateInfoWindow () {
        var googlePosition = new google.maps.LatLng(this.position.lat, this.position.lng);
        this.infoWindow.setContent(this.contentInfoWindow);
        this.infoWindow.setPosition(googlePosition);
    };

    var updateMarker = function updateMarker () {
        var googlePosition = new google.maps.LatLng(this.position.lat, this.position.lng);
        this.marker.setMap(null);
        this.marker.setAnimation(null);
        this.marker.setPosition(googlePosition);
        this.marker.setIcon(this.icon);
        this.marker.setMap(this.map);
    };

/****************************** Delete ***********************************/

    var deleteCircle = function deleteCircle (circle) {
        this.circle.setMap(null);
        this.circle = null;
    };

    var deleteInfoWindow = function deleteInfoWindow (infoWindow) {
        this.infoWindow.close();
        this.infoWindow = null;
    };

    var deleteMarker = function deleteMarker (marker) {
        this.marker.setMap(null);
        this.marker = null;
    };

/******************************** Others *************************************/

    // add MapOverlay to window:
    window.MapOverlay = MapOverlay;

 })();
