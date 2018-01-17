const blend = require('@mapbox/blend');

function BlendRasterSource(baseSource, overlaySource) {
  const stats = {
    requested: 0,
    rendered: 0
  };

  return {
    stats: stats,
    getTile: (z, x, y, callback) => {
      baseSource.getTile(z, x, y, (err, imageA) => {
        stats.requested += 1;
        stats.rendered += 1;
        if (err) return callback(err);
        overlaySource.getTile(z, x, y, (err, imageB) => {
          if (err) return callback(err);
          stats.rendered += 1;
          blend([
            { buffer: imageA },
            { buffer: imageB }
          ], { }, callback);
        });
      });
    }
  };
}

exports.BlendRasterSource = BlendRasterSource;
