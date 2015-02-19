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

Input Endpoints:

- **Insert/Update PoI**: Insert or update a Point of Interest. This endpoint
  supports sending just a PoI or severals through an array. Each PoI is composed
  of the following fields:
    - `id` (required):
    - `coordinates` (required):
        - `longitude` (required):
		- `latitude` (required):
        - `system`: geodetic datum system (usually WGS84, it can be UTM)
	- `title`:
    - `subtitle`:
    - `infoWindow`: content (using HTML) associated with the PoI.
    - `tooltip`: 
    - `data`: Data associated with the point of interest, used by the **PoI
      selected** output endpoint.
    - `icon`: URL of the icon to use for the marker
- **Insert/Update Centered PoI**: Insert or update a PoI and change the viewport
  centering the map on it. Uses the same format used by the **Insert/Update PoI**
  endpoint.
- **Select PoI**: Select a PoI and change
- **Delete PoI**: Removes a point or more point of interests from the map.

Output Endpoints:

- **PoI selected**: A PoI has been selected on the map.

### Examples
