/*
 *     (C) Copyright 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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
/* global MapOverlay */

(function () {

    "use strict";

/** ****************************************************************************/
/** ******************************* PUBLIC *************************************/
/** ****************************************************************************/

    var MapPoiManager = function MapPoiManager(map, radius) {
        this.map = map;
        this.markerClusterer = null;    // new MarkerClusterer(map);

        this.activePoi = null;  // the active poi.
        this.poiList = {};      // set of poiOverlais.

        this.updateRadius(radius);
    };

    MapPoiManager.prototype.updateRadius = function updateRadius(radius) {
        try {
            this.default_radius = parseFloat(radius, 10);
        } catch (e) {
            this.default_radius = 10;
        }
    };

    MapPoiManager.prototype.insertPoi = function insertPoi(poi, handler) {
        addPoi.call(this, poi, handler);
    };

    MapPoiManager.prototype.removePoi = function removePoi(poi) {
        deletePoi.call(this, poi);
    };

    MapPoiManager.prototype.selectPoi = function selectPoi(poi) {
        if (this.activePoi) {
            if (this.activePoi !== poi.id) {
                deactivatePoi.call(this, this.activePoi);
                activatePoi.call(this, poi);
            } else {
                deactivatePoi.call(this, this.activePoi);
            }
        } else {
            activatePoi.call(this, poi);
        }
    };

    MapPoiManager.prototype.centerMap = function centerMap(poi) {
        if (poi.id in this.poiList) {
            this.map.setCenter(this.poiList[poi.id].bounds.getCenter());
        }
    };

    MapPoiManager.prototype.getRoute = function getRoute(poiFromId, poiToId) {
        if (poiFromId in this.poiList && poiToId in this.poiList) {
            return {
                from: this.poiList[poiFromId].getPosition(),
                to: this.poiList[poiToId].getPosition()
            };
        }
    };

    MapPoiManager.prototype.getPoiList = function getPoiList() {
        return this.poiList;
    };

    MapPoiManager.prototype.getStringPoiList = function getPoiList() {
        return JSON.stringify(this.poiList);
    };

/** ****************************************************************************/
/** ******************************* PRIVATE ************************************/
/** ****************************************************************************/

    var addPoi = function addPoi(poi, handler) {
        // If poi exist into poiList
        if (poi.id in this.poiList) {
            // Update its position
            this.poiList[poi.id].updatePoi(poi);
        } else {
            // Else, add it to poiList
            var mapOverlay = new MapOverlay(this.map, this.markerClusterer, poi);
            mapOverlay.setMarkerHandler(handler);
            this.poiList[poi.id] = mapOverlay;
        }
    };

    var deletePoi = function deletePoi(poi) {
        if (poi.id in this.poiList) {
            // remove from poiList.
            this.poiList[poi.id].destroy();
            this.poiList[poi.id] = null;
            delete this.poiList[poi.id];
        }
    };

    var activatePoi = function activatePoi(poi) {
        // find poi in poiList.
        if (poi.id in this.poiList) {
            // show its overlays.
            this.poiList[poi.id].showOverlays();
        }
        this.activePoi = poi.id;
    };

    var deactivatePoi = function deactivatePoi(poiId) {
        // find poi in poiList.
        if (poiId in this.poiList) {
            // show its overlays.
            this.poiList[poiId].hideOverlays();
        }
        this.activePoi = null;
    };

    /** ****************************** HANDLERS ************************************/

    window.MapPoiManager = MapPoiManager;

})();
