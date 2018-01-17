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
    scheme: 'xyz',
    tilejson: '2.2.0',
    tiles: [
      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`
    ]
  };
}

module.exports = {
  mapboxStreets,
  mapboxSatellite
};
