'use strict';
const point = require('@turf/helpers').point;
const distance = require('@turf/distance');

function tileDistance(zoomLevel) {
  if (zoomLevel === 17) return 414; // the diagonal for a zoom level 17 tile
  if (zoomLevel > 17) throw new Error('z17 is highest zoom level');
  const diagonal = 2 * tileDistance(zoomLevel + 1);
  return diagonal;
}

function diagonalDistance(bbox) {
  const from = point(bbox.slice(0, 2));
  const to = point(bbox.slice(2, 4));
  return distance(from, to, {
    units: 'meters'
  });
}

function tileZoomBboxFits(bbox) {
  const distanceTable = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((z) => [z, tileDistance(z)]);
  const d = diagonalDistance(bbox);

  for (let i = 0; i < distanceTable.length; i++) {
    const z = distanceTable[i][0];
    const minDiagonal = distanceTable[i][1];
    if (d <= minDiagonal) return z;
  }

  return 17;
}

function decideZoom(bbox) {
  const z = tileZoomBboxFits(bbox);
  const goodReviewZoom = z + 2;
  return Math.min(17, goodReviewZoom);
}

exports.decideZoom = decideZoom;
