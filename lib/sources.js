'use strict';

function mapboxStreets(accessToken) {
  return {
    autoscale: true,
    bounds: [-180, -85, 180, 85],
    format: 'png8:m=h:c=64',
    id: 'mapbox.streets',
    maxzoom: 19,
    minzoom: 0,
    name: 'Streets',
    tileSize: 256,
    scheme: 'xyz',
    tilejson: '2.2.0',
    tiles: [
      `https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`
    ]
  };
}

function mapboxSatellite(accessToken) {
  return {
    bounds: [-180, -85, 180, 85],
    format: 'png8:m=h:c=64',
    id: 'mapbox.streets-review-satellite',
    maxzoom: 19,
    minzoom: 0,
    name: 'Satellite',
    tileSize: 256,
    scheme: 'xyz',
    tilejson: '2.2.0',
    tiles: [
      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`
    ]
  };
}

function naturalEarth() {
  return {
    bounds: [-180, -85, 180, 85],
    format: 'png8:m=h:c=64',
    id: 'naturalearthtiles.natural_earth_2',
    maxzoom: 6,
    minzoom: 0,
    name: 'Natural Earth II',
    tileSize: 512,
    scheme: 'xyz',
    tilejson: '2.2.0',
    tiles: [
      'http://naturalearthtiles.lukasmartinelli.ch/tiles/natural_earth_2.raster/{z}/{x}/{y}.png'
    ]
  };
}

module.exports = {
  naturalEarth,
  mapboxStreets,
  mapboxSatellite
};
