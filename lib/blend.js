'use strict';
const blend = require('@mapbox/blend');

function BlendRasterSource(baseSource, overlaySource) {
  const stats = {
    requested: 0,
    rendered: 0
  };

  function getTile(z, x, y, callback) {
    baseSource.getTile(z, x, y, function onBackgroundImage(err, imageA) {
      stats.requested += 1;
      stats.rendered += 1;
      if (err) return callback(err);
      overlaySource.getTile(z, x, y, function onOverlayImage(err, imageB) {
        if (err) return callback(err);
        stats.rendered += 1;
        blend([
          { buffer: imageA },
          { buffer: imageB }
        ], { }, callback);
      });
    });
  }

  return {
    stats: stats,
    getTile: getTile
  };
}

exports.BlendRasterSource = BlendRasterSource;
