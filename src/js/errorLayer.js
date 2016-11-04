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
/*global MashupPlatform StyledElements*/

(function(){

    "use strict";

/*****************************************************************************/
/******************************** PUBLIC *************************************/
/*****************************************************************************/

    /* This class control errors.
     * @constructor
     * */
    var ErrorLayer = function ErrorLayer (parentNode, imgIcon) {
        this.msg = "";
        this.parentNode = parentNode;
        this.imgIcon = imgIcon;
        this.closeButton = null;
        this.imgDiv = null;
        this.layerDiv = null;
        this.msgDiv = null;

        createLayer.call(this);
    };

    ErrorLayer.prototype.showError = function showError (msg) {
        this.layerDiv.style.display = "inline";
        this.imgDiv.style.display = "inline";
        this.msgDiv.textContent = msg;
        this.msgDiv.appendChild(this.closeButton);
    };

/*****************************************************************************/
/******************************** PRIVATE ************************************/
/*****************************************************************************/

    var createIcon = function createIcon () {
        this.imgDiv = document.createElement("img");
        this.imgDiv.setAttribute("src", this.imgIcon);
        this.imgDiv.addEventListener("click", showMsg.bind(this), false);
        this.imgDiv.style.display = "none";
    };

    var createCloseButton = function createCloseButton () {
        this.closeButton = document.createElement("button");
        this.closeButton.setAttribute("type", "button");
        this.closeButton.setAttribute("class", "close");
        this.closeButton.textContent = "x";
        this.closeButton.setAttribute("click", hideError.bind(this), false);
    };

    var createMsg = function createMsg () {
        this.msgDiv = document.createElement("div");
        this.msgDiv.setAttribute("class", "alert alert-block");
        this.msgDiv.style.display = "none";
    };

    var createLayer = function createLayer () {
        this.layerDiv = document.createElement("div");
        this.layerDiv.setAttribute("id", "error");
        this.layerDiv.style.display = "none";
        
        createIcon.call(this);
        createMsg.call(this);
        createCloseButton.call(this);

        this.layerDiv.appendChild(this.imgDiv);
        this.layerDiv.appendChild(this.msgDiv);
        this.parentNode.appendChild(this.layerDiv);
    };

    var hideError = function hideError () {
        this.msgDiv.style.display = "none";
        this.imgIcon.style.display = "none";
        this.layerDiv.style.display = "none";
    };

    var showMsg = function showMsg () {
        this.msgDiv.style.display = "block";
    };

/******************************* HANDLERS ************************************/

    window.ErrorLayer = ErrorLayer;

 })();
