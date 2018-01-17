'use strict';
const sources = require('./lib/sources');
const styles = require('./lib/styles');
const template = require('./lib/template');
const thumbnail = require('./lib/thumbnail');
const blend = require('./lib/blend');
const zoom = require('./lib/zoom');
const TileJSON = require('@mapbox/tilejson');
const bbox = require('@turf/bbox');
const abaculus = require('@mapbox/abaculus');
const sm = new (require('@mapbox/sphericalmercator'))();

function bestRenderParams(geojson, backgroundTileJSON) {
  let optimalZoom = zoom.decideZoom(bbox(geojson));
  if (optimalZoom > backgroundTileJSON.maxzoom) {
    optimalZoom = backgroundTileJSON.maxzoom;
  }
  if (optimalZoom < backgroundTileJSON.minzoom) {
    optimalZoom = backgroundTileJSON.minzoom;
  }

  function paddedExtent(geojson) {
    const extent = bbox(geojson);
    const minPad = Math.abs(sm.ll([0, 0], optimalZoom)[0] - sm.ll([150, 150], optimalZoom)[0]);
    console.log(minPad);
    const pad = Math.max(
      Math.abs(extent[2] - extent[0]) * 0.05,
      Math.abs(extent[3] - extent[1]) * 0.05,
      minPad,
      0.001
    );
    extent[0] -= pad;
    extent[1] -= pad;
    extent[2] += pad;
    extent[3] += pad;
    return extent;
  }

  const bounds = paddedExtent(geojson);
  return {
    zoom: optimalZoom,
    scale: 1,
    format: 'png',
    bbox: bounds,
    limit: 36000,
    tileSize: 256
  };
}


function renderThumbnail(geojson, callback, options) {
	options = Object.assign({
		stylesheet: styles.default,
		backgroundTileJSON: sources.mapboxSatellite(process.env.MapboxAccessToken),
		//backgroundTileJSON: sources.naturalEarth(),
	}, options);
  options.tileSize = options.backgroundTileJSON.tileSize || 256;

  console.log(options.backgroundTileJSON);

  template.templatizeStylesheet(options.stylesheet, (err, template) => {
    const backgroundUri =  { data: options.backgroundTileJSON };
		new TileJSON(backgroundUri, (err, backgroundSource) => {
	    const overlaySource = new thumbnail.ThumbnailSource(geojson, template, {
        tileSize: options.tileSize
      }, options.mapOptions);
      const blendSource = new blend.BlendRasterSource(backgroundSource, overlaySource);
      const renderParams = Object.assign(bestRenderParams(geojson, options.backgroundTileJSON), {
        tileSize: options.tileSize,
        getTile: blendSource.getTile
      })
      console.log(renderParams);
      abaculus(renderParams, (err, image, headers) => {
        callback(err, image, headers, blendSource.stats);
      });
    });
  });
}

module.exports = {
	renderThumbnail: renderThumbnail,
	sources: sources,
	styles: styles
}
