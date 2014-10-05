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
/*global google Poi MashupPlatform Coordinates console MarkerClusterer ErrorLayer MapPoiManager*/

(function () {

    "use strict";

    var MapViewer = function MapViewer (divIdName) {
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
        this.radius = 0;
        this.mapZoom = 11;
        this.preferenceZoom = parseZoomValue(MashupPlatform.prefs.get('zoomPreference'), 17);

        this.currentViewportPoiList = {};
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

        //To manage Step Route:
        this.activeRoute = {
            route: {},
            stepInfoWindow: null
        };
    };

    MapViewer.prototype.init = function init() {

        // Inicialize directions:
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});

        // Set Radius and center:
        setRadiusPreference.call(this, MashupPlatform.prefs.get("radiusPreference"));
        setCenterPreference.call(this, MashupPlatform.prefs.get("centerPreference"));

        // Create Map:
        this.createMap();

        // Create a error layer:
        this.errorLayer = new ErrorLayer(document.body, this.imgPath + 'warning.png');
    };

    MapViewer.prototype.createMap = function createMap () {
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

        // Bind directions with map:
        this.directionsDisplay.setMap(this.map);

        // Marker Clusterer
        this.mapPoiManager = new MapPoiManager(this.map, this.radius);

        // Set initial zoom
        this.map.setZoom(parseZoomValue(MashupPlatform.prefs.get("initialZoom"), 17));
    };


/*****************************************************************************/
/****************************** HANDLERS *************************************/
/*****************************************************************************/

/******************************** Input Handlers *****************************/

    var handlerInputRoute = function handlerInputRoute (fromToString) {
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
                this.directionsDisplay.setDirections({routes:[]});
            }
        } else {
            // Delete Route
            this.directionsDisplay.setDirections({routes:[]});
        }
    };

    var handlerInputRouteStep = function handlerInputRouteStep (stepNum) {
        if (this.activeRoute.stepInfoWindow) {
            this.activeRoute.stepInfoWindow.close(this.map);
        }
        var step = this.activeRoute.route.legs[0].steps[stepNum];
        var latLng = step.start_location;
        var content = step.instructions;
        this.activeRoute.stepInfoWindow = createInfoWindow.call(this, latLng, content);
        this.activeRoute.stepInfoWindow.open(this.map);
    };

    var handlerInputAddress = function handlerInputAddress (add) {
            findLocation(add, createMarker.bind(this));
    };

    var handlerInputCoords = function handlerInputDecimalCoord (decimalCoords) {
        var decPattern = /^-{0,1}[0-9]+.{0,1}[0-9]*, -{0,1}[0-9]+.{0,1}[0-9]*$/;
        if (decimalCoords && decPattern.test(decimalCoords)) {
            var decimalCoordsLatLng = decimalCoords.split(", ");
            var lat = parseFloat(decimalCoordsLatLng[0]);
            var lng = parseFloat(decimalCoordsLatLng[1]);
            var latLng = new google.maps.LatLng(lat, lng);
            createMarker.call(this, latLng);
        } else {
            console.log("Input Decimal Coord: wrong params.");
        }
    };

    var handlerInputPoi = function handlerInputPoi (poiString) {
        var poi = new Poi(JSON.parse(poiString));
        var handler = handlerClickMarkerPoi.bind(this, poi);
        this.mapPoiManager.insertPoi(poi, handler);
        sendPoiList.call(this);
    };

    var handlerInputDeletePoi = function handlerInputDeletePoi (poiString) {
        var poi = new Poi(JSON.parse(poiString));
        this.mapPoiManager.removePoi(poi);
        sendPoiList.call(this);
    };

    var handlerInputPoiCenter = function handlerInputPoiCenter (poiString) {
        var poi = new Poi(JSON.parse(poiString));
        this.mapPoiManager.insertPoi(poi, handlerClickMarkerPoi.bind(this, poi));
        this.mapPoiManager.selectPoi(poi);
        var position = poi.getDecimalCoords();
        var googleCoords = new google.maps.LatLng(position.lat, position.lng);
        this.map.setCenter(googleCoords);
        this.map.setZoom(this.preferenceZoom);
    };

    var handlerInputSelectPoi = function handlerInputSelectPoi(poiString) {
        var poi = new Poi(JSON.parse(poiString));
        this.mapPoiManager.selectPoi(poi);
        this.mapPoiManager.centerMap(poi);
        this.map.setZoom(this.preferenceZoom);
    };

/**************************** Preference Handler *****************************/

    var handlerPreferences = function handlerPreferences(preferences) {
        if ('radiusPreference') {
            setRadiusPreference.call(this, preferences.radiusPreference);
        }
        if ('centerPreference' in preferences) {
            setCenterPreference.call(this, preferences.centerPreference);
        }
        if ('zoomPreference' in preferences) {
            setZoomPreference.call(this, preferences.zoomPreference);
        }
    };

/****************************** Event Handlers *******************************/

    var handlerClickMarkerPoi = function handlerClickMarkerPoi (poi) {
        if (poi) {
            this.mapPoiManager.selectPoi(poi);
            MashupPlatform.wiring.pushEvent('poiOutput', JSON.stringify(poi));
        }
    };

    var handlerClickMarker = function handlerClickMarker (latLng, marker) {
        var circleOptions = {
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.10,
            center: latLng,
            radius: this.radius
        };
        var circle = new google.maps.Circle(circleOptions);
        circle.setMap(this.map);
        google.maps.event.addListenerOnce(marker, "click", deleteCircle.bind(this, latLng, circle, marker));
    };

    var handlerChangeViewport = function handlerChangeViewport () {
        sendBounds.call(this);
        sendPoiList.call(this);
    };


/*****************************************************************************/
/******************************* AUXILIAR ************************************/
/*****************************************************************************/

/******************************* Creators ************************************/

    var createMarker = function createMarker (latLng, iconUrl) {
        var imageSize = {};
        var markerImage = {};
        var marker = setMarker.call(this, latLng, iconUrl);
        marker.setAnimation(google.maps.Animation.DROP);
        google.maps.event.addListenerOnce(marker, "click", handlerClickMarker.bind(this, latLng, marker));
        this.map.setCenter(latLng);

        return marker;
    };

/******************************** Setters ************************************/

    var setMarker = function setMarker (latLng, iconUrl) {
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

    var setCenter = function setCenter(center){
        this.center = {
            lat: center.lat(),
            lng: center.lng()
        };
        this.map.setCenter(center);
    };

    var setRadiusPreference = function setRadiusPreference(radius) {
        if (this.radius) {
            this.mapPoiManager.updateRadius(radius);
        }
        this.radius = parseFloat(radius);
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

/******************************* Deletes *************************************/

    var deleteCircle = function deleteCircle (latLng, circle, marker) {
        circle.setMap(null);
        google.maps.event.addListenerOnce(marker, "click", handlerClickMarker.bind(this, latLng, marker));
    };

/******************************** Others *************************************/

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
    
/******************************* Senders *************************************/

    var sendBounds = function sendBounds () {
        var bounds = this.map.getBounds();
        MashupPlatform.wiring.pushEvent("boundsOutput", bounds.toString());
    };

    var sendPoiList = function sendPoiList () {
        var bounds = this.map.getBounds();

        if (bounds == null) {
            return;
        }

        var northBound = bounds.getNorthEast().lat();
        var eastBound = bounds.getNorthEast().lng();
        var southBound = bounds.getSouthWest().lat();
        var westBound = bounds.getSouthWest().lng();

        var coords, condNorth, condSouth, condEast, condWest, poi;

        this.currentViewportPoiList = {};

        var poiList = this.mapPoiManager.getPoiList();
        for (var poiId in poiList) {
            poi = poiList[poiId].poi;
            coords = poi.getDecimalCoords();

            condNorth = coords.lat < northBound;
            condSouth = coords.lat > southBound;
            condEast = coords.lng < eastBound;
            condWest = coords.lng > westBound;
            if (condNorth && condSouth && condEast && condWest) {
                this.currentViewportPoiList[poiId] = poi;
            }
        }

        if (this.currentViewportPoiList) {
            MashupPlatform.wiring.pushEvent("poiListOutput", JSON.stringify(this.currentViewportPoiList));
        }
    };


/****************************** Overlays *************************************/

    var createInfoWindow = function createInfoWindow (latLng, content) {
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

var mapViewer = new MapViewer("map_canvas");

document.addEventListener("DOMContentLoaded", mapViewer.init.bind(mapViewer), false);
