/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

/* jshint browser:true*/
/* global google*/

(function () {

    "use strict";

    var cache = {};

/** ****************************************************************************/
/** ******************************* PUBLIC *************************************/
/** ****************************************************************************/

    var MapOverlay = function MapOverlay(map, markerClusterer, poi, radius) {

        if (!map || !poi) {
            throw new TypeError("map and poi parameters are required.");
        }

        this.map = map;
        this.markerClusterer = markerClusterer;
        this.overlaysDisplayed = false;

        createElements.call(this, poi);
        this.updatePoi(poi);

        if (this.markerClusterer) {
            this.markerClusterer.addMarker(this.marker);
        }
    };

    MapOverlay.prototype.updatePoi = function updatePoi(poi) {
        this.poi = poi;
        this.icon = this.poi.icon;

        // Update Geometry
        var features = this.map.data.addGeoJson({
            id: poi.id,
            type: "Feature",
            geometry: poi.location
        });
        this.feature = features[0];
        this.feature.setProperty('poi', this.poi);

        // Get feature bounds and center
        var bounds = new google.maps.LatLngBounds();
        this.feature.getGeometry().forEachLatLng(function (coords) {bounds.extend(coords);});
        this.bounds = bounds;

        // Update Marker
        this.marker.setPosition(this.bounds.getCenter());
        this.marker.setTitle(this.poi.tooltip);

        // Update InfoWindow
        var infoWindow = '';
        if (this.poi.title != null) {
            let cleanedtitle = ("" + this.poi.title).trim();
            if (cleanedtitle != '') {
                infoWindow = "<h3>" + cleanedtitle + "</h3>";
            }
        }
        if (this.poi.infoWindow != null) {
            infoWindow += this.poi.infoWindow;
        }
        this.infoWindow.setContent(infoWindow);
        this.infoWindow.setPosition(this.bounds.getCenter());

        // Update Style
        this.style = parseStyle(this.poi.style);
        if (typeof this.icon === "string") {
            this.icon = {
                src: this.icon
            };
        }
        if (this.icon != null && typeof this.icon.src === "string") {
            if (cache[this.icon.src] == null) {
                var img = new Image();
                img.addEventListener("load", function () {
                    cache[this.icon.src] = new google.maps.Size(img.naturalWidth, img.naturalHeight);
                    img.markers.forEach(function (marker) {
                        marker.processMarkerSize();
                    });
                }.bind(this));
                img.src = this.icon.src;
                img.markers = [this];
                cache[this.icon.src] = img;
            } else if (cache[this.icon.src] instanceof google.maps.Size) {
                this.processMarkerSize();
            } else {
                cache[this.icon.src].markers.push(this);
            }
        }
        this.map.data.overrideStyle(this.feature, this.style);
    };

    MapOverlay.prototype.setMarkerHandler = function setMarkerHandler(handler) {
        google.maps.event.clearInstanceListeners(this.marker);
        google.maps.event.addListener(this.marker, "click", handler);
    };

    MapOverlay.prototype.showOverlays = function showOverlays() {
        this.infoWindow.open(this.map, this.marker);
        this.overlaysDisplayed = true;
    };

    MapOverlay.prototype.hideOverlays = function hideOverlays() {
        this.infoWindow.close();
        this.overlaysDisplayed = false;
    };

    MapOverlay.prototype.destroy = function destroy() {
        this.hideOverlays();

        if (this.markerClusterer) {
            this.markerClusterer.removeMarker(this.marker);
        }

        this.map.data.remove(this.feature);
        this.marker.setMap(null);
    };

    MapOverlay.prototype.getPosition = function getPosition() {
        return this.position;
    };

    MapOverlay.prototype.processMarkerSize = function processMarkerSize() {
        var size = cache[this.icon.src];

        var scaledSize = new google.maps.Size(size.width * this.icon.scale, size.height * this.icon.scale);

        if (this.icon.anchor == null) {
            this.icon.anchor = [0.5, 0.5];
        }

        if (this.icon.anchorXUnits !== "pixels") {
            this.icon.anchor[0] = scaledSize.width * this.icon.anchor[0];
        }
        if (this.icon.anchorYUnits !== "pixels") {
            this.icon.anchor[1] = scaledSize.height * this.icon.anchor[1];
        }

        var anchor = new google.maps.Point(this.icon.anchor[0], this.icon.anchor[1]);
        var icon = {
            anchor: anchor,
            url: this.icon.src,
            scaledSize: scaledSize
        };
        this.marker.setOptions({
            anchorPoint: new google.maps.Size(0, -scaledSize.height),
            icon: icon
        });
    };

/** ****************************************************************************/
/** ******************************* PRIVATE ************************************/
/** ****************************************************************************/


/** ********************************* Add **************************************/

    var RGBA_RE = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(?:\.\d+)?)\)$/;

    var parseStyle = function parseStyle(style) {
        var matches;

        if (style == null) {
            return {icon: null};
        }

        var newstyle = {};

        var fillColor = typeof style.fill === "string" ? style.fill : style.fill != null ? style.fill.color : null;
        if (fillColor != null && (matches = fillColor.match(RGBA_RE))) {
            newstyle.fillColor = "rgb(" + matches[1] + ', ' + matches[2] + ', ' + matches[3] + ")";
            newstyle.fillOpacity = parseFloat(matches[4]);
        } else if (fillColor != null) {
            newstyle.fillColor = fillColor;
            newstyle.fillOpacity = 1;
        }

        var strokeColor = typeof style.stroke === "string" ? style.stroke : style.stroke != null ? style.stroke.color : null;
        if (strokeColor != null && (matches = strokeColor.match(RGBA_RE))) {
            newstyle.strokeColor = "rgb(" + matches[1] + ', ' + matches[2] + ', ' + matches[3] + ")";
            newstyle.strokeOpacity = parseFloat(matches[4]);
        } else if (strokeColor != null) {
            newstyle.strokeColor = strokeColor;
            newstyle.strokeOpacity = 1;
        }
        newstyle.strokeWeight = style.stroke.width;

        return newstyle;
    };

    var createElements = function createElements(poi) {

        this.marker = new google.maps.Marker({
            map: this.map,
            visible: true
        });

        this.infoWindow = new google.maps.InfoWindow();
    };


/** ****************************** Others *************************************/

    // add MapOverlay to window:
    window.MapOverlay = MapOverlay;

})();
