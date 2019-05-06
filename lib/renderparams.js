'use strict';
const zoom = require('./zoom');
const bbox = require('@turf/bbox').default;
const sm = new (require('@mapbox/sphericalmercator'))();

module.exports = bestRenderParams;

function bestRenderParams(geojson, minZoom, maxZoom, noPadding) {
  let optimalZoom = zoom.decideZoom(bbox(geojson));
  optimalZoom = Math.max(minZoom, Math.min(maxZoom, optimalZoom));

  function addPadding(extent, pad) {
    extent[0] -= pad;
    extent[1] -= pad;
    extent[2] += pad;
    extent[3] += pad;
    return extent;
  }

  function paddedExtent(geojson) {
    const extent = bbox(geojson);

    const topRight = sm.px([extent[2], extent[3]], optimalZoom);
    const bottomLeft = sm.px([extent[0], extent[1]], optimalZoom);
    const width = topRight[0] - bottomLeft[0];
    const height = bottomLeft[1] - topRight[1];
    const minSize = 200;

    // TODO: Padding is super hacky without any real background checking what we should do
    let minPad = Math.abs(sm.ll([0, 0], optimalZoom)[0] - sm.ll([10, 10], optimalZoom)[0]);

    if (width < minSize) {
      minPad = Math.abs(sm.ll([0, 0], optimalZoom)[0] - sm.ll([minSize - width, 10], optimalZoom)[0]);
    }
    if (height < minSize) {
      minPad = Math.abs(sm.ll([0, 0], optimalZoom)[0] - sm.ll([minSize - height, 10], optimalZoom)[0]);
    }

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

  const bounds = noPadding ? addPadding(bbox(geojson), 0.0001) : paddedExtent(geojson);
  return {
    // ensure zoom is within min and max bounds configured for thumbnail
    zoom: optimalZoom,
    scale: 1,
    format: 'png',
    bbox: bounds,
    limit: 36000,
    tileSize: 256
  };
}
