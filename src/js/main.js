
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

/* globals google Poi MashupPlatform Wirecloud console ErrorLayer MapPoiManager*/
/* exported MapViewer*/

(function () {

    "use strict";

    var MapViewer = function MapViewer(divIdName) {
        /* This widget uses Google Maps API v3 */

        // Input callbacks:
        MashupPlatform.wiring.registerCallback("routeInput", handlerInputRoute.bind(this));
        MashupPlatform.wiring.registerCallback("routeStepInput", handlerInputRouteStep.bind(this));
        MashupPlatform.wiring.registerCallback("addressInput", handlerInputAddress.bind(this));
        MashupPlatform.wiring.registerCallback("coordsInput", handlerInputCoords.bind(this));
        MashupPlatform.wiring.registerCallback("poiInput", handlerInputPoi.bind(this));
        MashupPlatform.wiring.registerCallback("deletePoiInput", handlerInputDeletePoi.bind(this));
        MashupPlatform.wiring.registerCallback("poiInputCenter", handlerInputPoiCenter.bind(this));
        MashupPlatform.wiring.registerCallback("selectPoiInput", handlerInputSelectPoi.bind(this));

        // Preferences callback:
        MashupPlatform.prefs.registerCallback(handlerPreferences.bind(this));

        /* HTML variables */
        this.divIdName = divIdName;
        this.imgPath = 'images/';

        // Other variables:
        this.map = null;
        this.center = {};
        this.mapZoom = 11;
        this.preferenceZoom = parseZoomValue(MashupPlatform.prefs.get('zoomPreference'), 13);

        // this.activeOverlayPoi = null;     // poi that has active overlays
        // this.pois = {};
        /*  this.pois = {
         *      "poiId": {
         *          "poi":{},
         *          "circle":{},
         *          "infoWindow":{},
         *          "marker":{}
         *      }
         *  };
         * */

        // Google Direction Services:
        this.directionsService = {};
        this.directionsDisplay = {};
        this.travelMode = google.maps.DirectionsTravelMode.DRIVING; // map type view.

        // To manage Step Route:
        this.activeRoute = {
            route: {},
            stepInfoWindow: null
        };
    };

    MapViewer.prototype.init = function init() {

        // Inicialize directions:
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});

        // Create Map:
        this.createMap();

        // Center the map in the initial location
        setCenterPreference.call(this, MashupPlatform.prefs.get("centerPreference"));

        // Create a error layer:
        this.errorLayer = new ErrorLayer(document.body, this.imgPath + 'warning.png');
    };

    MapViewer.prototype.createMap = function createMap() {
        // set options to see an hybrid map with zoom enougth center in somewhere:
        this.mapOptions = {
            zoom: this.mapZoom,
            center: new google.maps.LatLng(0, 0),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        // Create map:
        var div = document.getElementById(this.divIdName);
        this.map = new google.maps.Map(div, this.mapOptions);

        // Set handler to manage viewport changes:
        google.maps.event.addListener(this.map, "bounds_changed", handlerChangeViewport.bind(this));
        this.map.data.setStyle({icon: {path: ""}});
        this.map.data.addListener('click', function (event) {
            handlerClickMarkerPoi.call(this, event.feature.getProperty('poi'));
        }.bind(this));

        // Bind directions with map:
        this.directionsDisplay.setMap(this.map);

        // Marker Clusterer
        this.mapPoiManager = new MapPoiManager(this.map);

        // Set initial zoom
        this.map.setZoom(parseZoomValue(MashupPlatform.prefs.get("initialZoom"), 3));
    };


/** ***************************************************************************/
/** **************************** HANDLERS *************************************/
/** ***************************************************************************/

/** ****************************** Input Handlers *****************************/

    var handlerInputRoute = function handlerInputRoute(fromToString) {
        /*  route example:
         *      {
         *          from: "iss33"
         *          to: "tech12"
         *      }
         * */
        var fromToIds = JSON.parse(fromToString);
        if (fromToIds.from && fromToIds.to) {
            var route = this.mapPoiManager.getRoute(fromToIds.from, fromToIds.to);
            if (route) {
                var request = {
                    origin: new google.maps.LatLng(route.from.lat, route.from.lng),
                    destination: new google.maps.LatLng(route.to.lat, route.to.lng),
                    travelMode: this.travelMode
                };

                this.directionsService.route(request, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        this.directionsDisplay.setDirections(response);
                        this.activeRoute.route = response.routes[0];
                        if (this.activeRoute.stepInfoWindow) {
                            this.activeRoute.stepInfoWindow.close();
                        }
                        MashupPlatform.wiring.pushEvent("routeDescriptionOutput", response.routes);
                    }
                }.bind(this));
            } else {
                this.directionsDisplay.setDirections({routes: []});
            }
        } else {
            // Delete Route
            this.directionsDisplay.setDirections({routes: []});
        }
    };

    var handlerInputRouteStep = function handlerInputRouteStep(stepNum) {
        if (this.activeRoute.stepInfoWindow) {
            this.activeRoute.stepInfoWindow.close(this.map);
        }
        var step = this.activeRoute.route.legs[0].steps[stepNum];
        var latLng = step.start_location;
        var content = step.instructions;
        this.activeRoute.stepInfoWindow = createInfoWindow.call(this, latLng, content);
        this.activeRoute.stepInfoWindow.open(this.map);
    };

    var handlerInputAddress = function handlerInputAddress(add) {
        findLocation(add, createMarker.bind(this));
    };

    var handlerInputCoords = function handlerInputDecimalCoord(decimalCoords) {
        var decPattern = /^-{0,1}[0-9]+.{0,1}[0-9]*, -{0,1}[0-9]+.{0,1}[0-9]*$/;
        if (decimalCoords && decPattern.test(decimalCoords)) {
            var decimalCoordsLatLng = decimalCoords.split(", ");
            var lat = parseFloat(decimalCoordsLatLng[0]);
            var lng = parseFloat(decimalCoordsLatLng[1]);
            var latLng = new google.maps.LatLng(lat, lng);
            createMarker.call(this, latLng);
        } else {
            Wirecloud.widget.log("Input Decimal Coord: wrong params.");
        }
    };

    var handlerInputPoi = function handlerInputPoi(poi_list) {
        var poi, handler;

        if (typeof poi_list === "string") {
            try {
                poi_list = JSON.parse(poi_list);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        }

        if (!Array.isArray(poi_list)) {
            poi_list = [poi_list];
        }

        for (var i = 0; i < poi_list.length; i++) {
            poi = new Poi(poi_list[i]);
            handler = handlerClickMarkerPoi.bind(this, poi);
            this.mapPoiManager.insertPoi(poi, handler);
        }
        sendPoiList.call(this);
    };

    var handlerInputDeletePoi = function handlerInputDeletePoi(poi) {
        if (typeof poi === "string") {
            try {
                poi = JSON.parse(poi);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        }

        this.mapPoiManager.removePoi(new Poi(poi));
        sendPoiList.call(this);
    };

    var handlerInputPoiCenter = function handlerInputPoiCenter(poi) {
        if (typeof poi === "string") {
            try {
                poi = JSON.parse(poi);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        }
        poi = new Poi(poi);

        this.mapPoiManager.insertPoi(poi, handlerClickMarkerPoi.bind(this, poi));
        this.mapPoiManager.selectPoi(poi);
        var position = poi.getDecimalCoords();
        var googleCoords = new google.maps.LatLng(position.lat, position.lng);
        this.map.setCenter(googleCoords);
        this.map.setZoom(this.preferenceZoom);
    };

    var handlerInputSelectPoi = function handlerInputSelectPoi(poi) {
        if (typeof poi === "string") {
            try {
                poi = JSON.parse(poi);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        }
        poi = new Poi(poi);

        this.mapPoiManager.selectPoi(poi);
        this.mapPoiManager.centerMap(poi);
        this.map.setZoom(this.preferenceZoom);
    };

/** ************************** Preference Handler *****************************/

    var handlerPreferences = function handlerPreferences(preferences) {
        if ('centerPreference' in preferences) {
            setCenterPreference.call(this, preferences.centerPreference);
        }
        if ('zoomPreference' in preferences) {
            this.preferenceZoom = parseZoomValue(MashupPlatform.prefs.get('zoomPreference'), 13);
        }
    };

/** **************************** Event Handlers *******************************/

    var handlerClickMarkerPoi = function handlerClickMarkerPoi(poi) {
        if (poi) {
            this.mapPoiManager.selectPoi(poi);
            MashupPlatform.wiring.pushEvent('poiOutput', poi);
        }
    };

    var handlerChangeViewport = function handlerChangeViewport() {
        sendBounds.call(this);
        sendPoiList.call(this);
    };


/** ***************************************************************************/
/** ***************************** AUXILIAR ************************************/
/** ***************************************************************************/

/** ***************************** Creators ************************************/

    var createMarker = function createMarker(latLng, iconUrl) {
        var marker = setMarker.call(this, latLng, iconUrl);
        marker.setAnimation(google.maps.Animation.DROP);
        this.map.setCenter(latLng);

        return marker;
    };

/** ****************************** Setters ************************************/

    var setMarker = function setMarker(latLng, iconUrl) {
        var markerOptions = {
            map: this.map,
            position: latLng,
            visible: true
        };

        if (iconUrl) {
            var imageSize = new google.maps.Size(40, 40);
            markerOptions.icon = new google.maps.MarkerImage(iconUrl, null, null, null, imageSize);
        }

        return new google.maps.Marker(markerOptions);
    };

    var setCenter = function setCenter(center) {
        this.center = {
            lat: center.lat(),
            lng: center.lng()
        };
        this.map.setCenter(center);
    };

    var setCenterPreference = function setCenterPreference(center) {
        findLocation(center, setCenter.bind(this));
    };

    var parseZoomValue = function parseZoomValue(zoom, default_level) {
        var zoomvalue;
        if (zoom === '') {
            return default_level;
        }

        zoomvalue = parseInt(zoom, 10);
        if (zoomvalue < 1) {
            zoomvalue = 1;
        } else if (zoomvalue > 22) {
            zoomvalue = 22;
        }
        return zoomvalue - 1;
    };

/** ****************************** Others *************************************/

    var findLocation = function findLocation(add, func) {
        /*  Google Geocoding API is subject to a query limit of 2,500 geolocation requests per day.
         *  User of Google Maps API for Business may perform up to 100,000 requests per day. */
        var geocoder = new google.maps.Geocoder();
        var geocoderRequest = {
            address: add
        };
        /* Google has an asynchronous service */
        geocoder.geocode(geocoderRequest, function (gcResult, gcStatus) {
            if (gcStatus == google.maps.GeocoderStatus.OK) {
                func.call(this, gcResult[0].geometry.location);
            }
        }.bind(this));
    };

/** ***************************** Senders *************************************/

    var sendBounds = function sendBounds() {
        var bounds = this.map.getBounds();
        MashupPlatform.wiring.pushEvent("boundsOutput", bounds.toString());
    };

    var sendPoiList = function sendPoiList() {

        if (!MashupPlatform.widget.outputs.poiListOutput.connected) {
            return;
        }

        var bounds = this.map.getBounds();

        if (bounds == null) {
            return;
        }

        let currentViewportPoiList = {};

        var poiList = this.mapPoiManager.getPoiList();
        for (var poiId in poiList) {
            var overlay = poiList[poiId];

            if (overlay.bounds.intersects(bounds)) {
                currentViewportPoiList[poiId] = overlay.poi;
            }
        }

        MashupPlatform.wiring.pushEvent("poiListOutput", currentViewportPoiList);
    };


/** **************************** Overlays *************************************/

    var createInfoWindow = function createInfoWindow(latLng, content) {
        var infoWindow = new google.maps.InfoWindow();

        if (!content) {
            content = "<div><span>Unavailable data.</span></div>";
        }

        infoWindow.setContent(content);
        infoWindow.setPosition(latLng);

        return infoWindow;
    };

    window.MapViewer = MapViewer;

})();

// eslint-disable-next-line
var mapViewer = new MapViewer("map_canvas");

document.addEventListener("DOMContentLoaded", mapViewer.init.bind(mapViewer), false);
