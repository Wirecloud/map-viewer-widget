# Introduction

This widget provides a basic and simple map viewer using the Google Maps API
(concretelly v3 of that API).

## Features

* Support for custom PoI's comming from other data sources (e.g. by using other
  resources as CKAN Source, NGSI Source, vCards, ...). Those PoI's sources can
  customize the marker icon, the description of the marker (shown on bubbles),
  etc.
* Routes, including providing route steps/descriptions to other
  widgets/operators
* Allow other widgets/operator interact with the selected PoI's

## Settings

- **Mark shadow radius** (default: 10) When you click in a mark you will see a
  circle with this radius.
- **Initial Location** (deafult: "") Initial Location" description="Location or
  decimal coordinates where map will be centered on load (e.g. 'New York' or
  '52, 5'). Leave this setting empty if you don't want to center the map at
  init. Remember to change the **initial zoom level** if you provide an initial
  place.
- **Zoom Level** (default: 13) Zoom level when the map is centered. From 1 to
  22, where '1' represents the furthest level and '22' the maximum zoom level.
- **Initial Zoom Level** (default=3) Initial zoom level. From 1 to 22, where '1'
  represents the furthest level and '22' the maximum zoom level.

## Wiring

### Input Endpoints

- **Insert/Update PoI**: Insert or update a Point of Interest. This endpoint
  supports sending just a PoI or severals through an array. Each PoI is composed
  of the following fields:
    - **`id`** (required): id used for identifying this PoI. Used in the update
      and delete operations for locating the associated PoI.
    - `currentLocation` (deprecated, required if `location` not used):
        - `longitude` (required):
		- `latitude` (required):
        - `system`: geodetic datum system (usually WGS84, it can be UTM)
    - `data`: Data associated with the point of interest, used by the **PoI
      selected** output endpoint.
    - `icon`: URL of the icon to use for the marker or an object describing the
        icon to use. Available options:
        - `anchor`: Anchor position. Default value is `[0.5, 0.5]` (icon
          center).
        - `anchorXUnits`: Units in which the anchor x value is specified. A
          value of `'fraction'` indicates the x value is a fraction of the
          icon. A value of `'pixels'` indicates the x value in pixels. Default
          is `'fraction'`.
        - `anchorYUnits`: Units in which the anchor y value is specified. A
          value of `'fraction'` indicates the y value is a fraction of the
          icon. A value of `'pixels'` indicates the y value in pixels. Default
          is `'fraction'`.
        - `opacity`: Opacity of the icon (range from 0 to 1). Default is `1`.
        - `scale`: Scale. Default is `1`.
        - `src`: Image source URI.
    - `infoWindow`: content (using HTML) associated with the PoI.
    - `location` (required if `currentLocation` not used): a GeoJSON geometry.
      e.g. `{"type": "Point", "coordinates": [125.6, 10.1]}`
    - `style`: Style to use for rendering. Supported options:
        - `fill`:
            - `color`: fill color. CSS3 color, that is, an hexadecimal, `rgb` or
            `rgba` color.
        - `stroke`:
            - `color`: stroke color. CSS3 color, that is, an hexadecimal, `rgb`
            or `rgba` color.
            - `width`: stroke width in pixels.
    - `subtitle`: subtitle associated to the PoI
    - `title`: title associated to the PoI
    - `tooltip`: text to be displayed as tooltip when the mouse is over the PoI.
- **Insert/Update Centered PoI**: Insert or update a PoI and change the viewport
  centering the map on it. Uses the same format used by the **Insert/Update PoI**
  endpoint.
- **Select PoI**: Select a PoI and change
- **Delete PoI**: Removes a point or more point of interests from the map.

### Output Endpoints

- **PoI selected**: A PoI has been selected on the map.

### Examples
