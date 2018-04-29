'use strict';
const sources = require('./lib/sources');
const styles = require('./lib/styles');
const template = require('./lib/template');
const thumbnail = require('./lib/thumbnail');
const blend = require('./lib/blend');
const bestRenderParams = require('./lib/renderparams');
const TileJSON = require('@mapbox/tilejson');
const abaculus = require('@mapbox/abaculus');

function renderOverlay(geojson, options, template, callback) {
  const overlaySource = new thumbnail.ThumbnailSource(geojson, template, options.image, options.map);
  const renderParams = Object.assign(bestRenderParams(geojson, options.minzoom, options.maxzoom, !!options.noPadding), {
    format: options.blendFormat || 'png',
    tileSize: options.tileSize,
    getTile: overlaySource.getTile.bind(overlaySource)
  });
  abaculus(renderParams, (err, image, headers) => {
    callback(err, image, headers, overlaySource.stats);
  });
}

function renderOverlayWithBackground(geojson, options, template, callback) {
  const backgroundUri =  { data: options.background.tilejson };
  new TileJSON(backgroundUri, (err, backgroundSource) => {
    const overlaySource = new thumbnail.ThumbnailSource(geojson, template, options.image, options.map);
    const blendSource = new blend.BlendRasterSource(backgroundSource, overlaySource);
    const renderParams = Object.assign(bestRenderParams(geojson, options.minzoom, options.maxzoom), {
      format: options.blendFormat || 'png',
      tileSize: options.tileSize,
      getTile: blendSource.getTile
    });
    abaculus(renderParams, (err, image, headers) => {
      callback(err, image, headers, blendSource.stats);
    });
  });
}

/**
 * Render a thumbnmail from a GeoJSON feature
 * @param {Object} geojson - GeoJSON Feature or FeatureCollection
 * @param {Function} callback - Callback called with rendered image once finished
 * @param {Object} options
 * @param {Object} [options.image] - Image options
 * @param {Object} [options.map] - Map options
 * @param {Object} [options.background] - Render thumbnail on a background
 * @param {Object} [options.background.tilejson] - TileJSON for the background layer
 * @param {Number} [options.minzoom] - Specify a min zoom level to render thumbnail
 * @param {Number} [options.maxzoom] - Specify a max zoom level to render thumbnail
 * @param {string} [options.format] - Format to use when blended together with the background image. https://github.com/mapbox/node-blend#options
 */
function renderThumbnail(geojson, callback, options) {
  if (!geojson) throw new Error('Cannot render thumbnail without GeoJSON passed');
  // someone accidentally passed in a callback as options
  if (typeof options === 'function') throw new Error('Options needs to be an object not a function');
  if (typeof callback !== 'function') throw new Error('Callback needs to be a function not an object');

  options = Object.assign({
    noPadding: false,
    minzoom: 0,
    maxzoom: 22,
    stylesheet: styles.default,
    tileSize: 256
  }, options);

  options.image = Object.assign({
    tileSize: options.tileSize
  }, options.image);

  // Background source zoom always limits the possible min and maxzoom
  if (options.background && options.background.tilejson) {
    options.minzoom = Math.max(options.minzoom, options.background.tilejson.minzoom);
    options.maxzoom = Math.min(options.maxzoom, options.background.tilejson.maxzoom);
  }

  template.templatizeStylesheet(options.stylesheet, (err, template) => {
    // If no background specified we only render the overlay
    if (options.background && options.background.tilejson) {
      return renderOverlayWithBackground(geojson, options, template, callback);
    } else {
      return renderOverlay(geojson, options, template, callback);
    }
  });
}

module.exports = {
  renderThumbnail: renderThumbnail,
  sources: sources,
  styles: styles
};
