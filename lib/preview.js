'use strict';
const turf = require('@turf/turf');
const retry = require('retry');
const _ = require('lodash');
const Writable = require('stream').Writable;
const Transform = require('stream').Transform;
const abaculus = require('@mapbox/abaculus');
const TileJSON = require('@mapbox/tilejson');
const PreviewSource = require('./PreviewSource');

const blend = require('@mapbox/blend');
const AWS = require('aws-sdk');
const view = require('../lib/view');
const s3scan = require('@mapbox/s3scan');
const s3urls = require('@mapbox/s3urls');
const parallel = require('parallel-stream');

function blendPreview(baseTilejson, feature, callback) {
  if (!process.env.MapboxAccessToken) return callback(new Error('Env var MapboxAccessToken must be set'));

  const styledFeature = feature;
  const sources = {};
  const stats = {
    requested: 0,
    rendered: 0
  };

  function getTile(z, x, y, callback) {
    sources.tilejson.getTile(z, x, y, (err, imageA) => {
      stats.requested += 1;
      stats.rendered += 1;
      if (err) return callback(err);
      sources.overlay.getTile(z, x, y, (err, imageB) => {
        if (err) return callback(err);
        stats.rendered += 1;
        blend([
          { buffer: imageA },
          { buffer: imageB }
        ], { }, callback);
      });
    });
  }

  new TileJSON(baseTilejson, afterTileJSON);

  function afterTileJSON(err, source) {
    if (err) return callback(err);
    sources.tilejson = source;
    const previewSource = new PreviewSource(styledFeature);
    afterOverlay(null, previewSource);
  }

  function afterOverlay(err, source) {
    if (err) return callback(err);
    sources.overlay = source;

    const bbox = featureExtent(styledFeature);
    const params = {
      zoom: decideZoom(bbox),
      scale: 1,
      bbox: bbox,
      limit: 36000,
      tileSize: 256,
      getTile: getTile
    };

    abaculus(params, (err, image, headers) => {
      callback(err, image, headers, stats);
    });
  }
}

function tileDistance(zoomLevel) {
  if (zoomLevel === 17) return 414; // the diagonal for a zoom level 17 tile
  if (zoomLevel > 17) throw new Error('z17 is highest zoom level');
  const diagonal = 2 * tileDistance(zoomLevel + 1);
  return diagonal;
}

function diagonalDistance(bbox) {
  const from = turf.point(bbox.slice(0, 2));
  const to = turf.point(bbox.slice(2, 4));
  return turf.distance(from, to, {
    units: 'meters'
  });
}

function tileZoomBboxFits(bbox) {
  const distanceTable = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8].map((z) => [z, tileDistance(z)]);
  const d = diagonalDistance(bbox);

  for (let i = 0; i < distanceTable.length; i++) {
    const z = distanceTable[i][0];
    const minDiagonal = distanceTable[i][1];
    if (d <= minDiagonal) return z;
  }

  // if all else fails we always use default zoom level 17
  return 17;
}

function decideZoom(bbox) {
  const z = tileZoomBboxFits(bbox);
  const goodReviewZoom = z + 2;
  return Math.min(17, goodReviewZoom);
}

function featureExtent(feature) {
  const extent = turf.bbox(feature);
  const pad = Math.max(
    Math.abs(extent[2] - extent[0]) * 0.05,
    Math.abs(extent[3] - extent[1]) * 0.05,
    0.001
  );
  extent[0] -= pad;
  extent[1] -= pad;
  extent[2] += pad;
  extent[3] += pad;
  return extent;
}

function satelliteTilejson(accessToken) {
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
      `https://api.mapbox.com/styles/v1/mapbox/cjchh2bgn5asf2qod1t1vwprr/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`
    ]
  };
}

function streetsTilejson(accessToken) {
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

function RenderPreviewStream(options) {
  options = Object.assign({
    satellitePreview: satellitePreview,
    streetsPreview: streetsPreview
  }, options);
  const s3 = options.s3 || new AWS.S3();
  const stream = parallel.transform(_transform, Object.assign({ objectMode: true, concurrency: 5 }, options));

  function _render(baseLayer, collection, callback) {
    // collection.properties = { day: '2017-10-23', layer: 'road' };
    let renderFunc = options.streetsPreview;
    let url = view.streetsPreviewUrl('streets-review', collection.properties.day, collection.properties.layer, collection.id);

    if (baseLayer === 'satellite') {
      renderFunc = options.satellitePreview;
      url = view.satellitePreviewUrl('streets-review', collection.properties.day, collection.properties.layer, collection.id);
    }

    const operation = retry.operation({
      minTimeout: 5 * 1000,
      maxTimeout: 300 * 1000,
      retries: 7,
      factor: 2,
      randomize: true
    });
    operation.attempt(() => {
      renderFunc(collection, (err, image) => {
        if (operation.retry(err)) {
          console.error('Retrying render', err);
          return;
        }
        if (err) {
          return callback(operation.mainError());
        }
        const params = Object.assign({
          Body: image,
          ACL: 'public-read'
        }, s3urls.fromUrl(url));
        s3.putObject(params, (err) => {
          if (err) return callback(err);
          callback(null, url);
        });
      });
    });
  }

  function _transform(collection, enc, callback) {
    try {
      _render('streets', collection, (err, streetsUrl) => {
        if (err) return callback(err);
        _render('satellite', collection, (err, satelliteUrl) => {
          if (err) return callback(err);
          stream.push({
            viewId: collection.id,
            day: collection.properties.day,
            layer: collection.properties.layer,
            previews: {
              streets: streetsUrl,
              satellite: satelliteUrl
            }
          });
          callback(null);
        });
      });
    } catch (err) {
      if (err.message.match(/Desired image is too large/)) {
        stream.emit('toolarge', err, collection);
        callback(null);
      } else {
        throw err;
      }
    }
  }

  return stream;
}

class PublishRenderJobs extends Writable {
  constructor(topicArn) {
    super({ objectMode: true });
    this._sns = new AWS.SNS({
      maxRetries: 5,
      region: 'us-east-1'
    });
    this._topicArn = topicArn;
  }

  _write(views, enc, callback) {
    const job = { views: views };
    this._sns.publish({
      Message: JSON.stringify(job),
      Subject: 'RENDER_PREVIEW',
      TopicArn: this._topicArn
    }, (err) => {
      if (err) return callback(err);
      callback();
    });
  }
}

class SetPreviewUrlsStream extends Transform {
  constructor(viewTable) {
    super({ objectMode: true });
    this._viewTable = viewTable;
  }

  _transform(previewUpdate, enc, callback) {
    this._viewTable.setPreviews(previewUpdate.day, previewUpdate.viewId, previewUpdate.previews)
      .then(() => {
        callback(null, previewUpdate);
      })
      .catch(callback);
  }
}

function renderPreviews(viewUrlStream, viewTable) {
  return new Promise((resolve, reject) => {
    const previewStream = new RenderPreviewStream()
      .on('toolarge', (err, failedView) => {
        console.error('Could not render', failedView.id, 'to', err);
      })
      .on('data', (previewUpdate) => console.log('Rendered', _.values(previewUpdate.previews).join(', ')))
      .on('error', (err) => reject(err))
      .on('end', () => resolve());

    const setPreviewUrlsStream = new SetPreviewUrlsStream(viewTable);
    const downloadStream = s3scan.Get(process.env.ReviewBucket, {
      keys: true
    }).on('error', (err) => reject(err));

    viewUrlStream
      .pipe(new view.ViewKeyStream())
      .pipe(downloadStream)
      .pipe(new view.ParseStream())
      .pipe(previewStream)
      .pipe(setPreviewUrlsStream);
  });
}

function streetsPreview(feature, callback) {
  const streetsBase = { data: streetsTilejson(process.env.MapboxAccessToken) };
  blendPreview(streetsBase, feature, callback);
}

function satellitePreview(feature, callback) {
  const satelliteBase = { data: satelliteTilejson(process.env.MapboxAccessToken) };
  blendPreview(satelliteBase, feature, callback);
}

exports.streetsPreview = streetsPreview;
exports.satellitePreview = satellitePreview;
exports.renderPreviews = renderPreviews;
exports.decideZoom = decideZoom;
exports.PublishRenderJobs = PublishRenderJobs;
exports.RenderPreviewStream = RenderPreviewStream;
exports.SetPreviewUrlsStream = SetPreviewUrlsStream;
