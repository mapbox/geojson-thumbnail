'use strict';
const mapnik = require('mapnik');
const sm = new (require('@mapbox/sphericalmercator'))();
const events = require('events');

if (mapnik.register_default_input_plugins) {
  mapnik.register_default_input_plugins();
}

/**
 * Create a new source that returns tiles from a Mapnik xml stylesheet template
 * and a GeoJSON object.
 * @private
 * @param {object} GeoJSON object
 * @param {function} callback
 * @returns {undefined}
 */
class ThumbnailSource extends events.EventEmitter {
  constructor(geojson, template, imageOptions, mapOptions) {
    super();
    this._size = imageOptions.tileSize || 256;
    this._imageEncoding = imageOptions.encoding || 'png8:m=h:z=1';
    this._bufferSize = 64;
    this._mapOptions = mapOptions || {};
    this._xml = template.replace('{{geojson}}', JSON.stringify(geojson));
  }

  /**
   * Gets a tile from this source.
   *
   * @param {number} z
   * @param {number} x
   * @param {number} y
   * @param {function} callback
   */
  getTile(z, x, y, callback) {
    const encoding = this._imageEncoding;
    const size = this._size;
    const map = new mapnik.Map(size, size);
    map.bufferSize = this._bufferSize;

    try {
      // TODO: It is not smart or performant to create a new mapnik instance for each tile rendering
      map.fromString(this._xml, this._mapOptions, function onMapLoaded(err) {
        if (err) return callback(err);
        map.extent = sm.bbox(x, y, z, false, '900913');
        map.render(new mapnik.Image(size, size), {}, function onImageRendered(err, image) {
          if (err) return callback(err);
          image.encode(encoding, function onImageEncoded(err, encodedImage) {
            callback(err, encodedImage);
          });
        });
      });
    } catch (e) {
      callback(e);
    }
  }
}

exports.ThumbnailSource = ThumbnailSource;
