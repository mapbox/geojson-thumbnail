'use strict';
const tape = require('tape');
const fs = require('fs');
const path = require('path');
const sources = require('../lib/sources');
const index = require('../index');


function assertThumbnailRenders(fixturePath, assert, options) {
  const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, fixturePath)));

  index.renderThumbnail(geojson, (err, image) => {
    assert.ifError(err, 'preview should not fail');
    assert.true(image.length > 10 * 1024, `preview image should have reasonable image size ${image.length}`);
    assert.end();
  }, Object.assign({
    backgroundTileJSON: sources.naturalEarth()
  }, options));
}

tape('renderThumbnail water', (assert) => {
  assertThumbnailRenders('/fixtures/water.geojson', assert);
});

tape('renderThumbnail road', (assert) => {
  assertThumbnailRenders('/fixtures/road.geojson', assert);
});

tape('renderThumbnail building', (assert) => {
  assertThumbnailRenders('/fixtures/building.geojson', assert);
});

tape('renderThumbnail peak', (assert) => {
  assertThumbnailRenders('/fixtures/peak.geojson', assert);
});

tape('renderThumbnail as png with better compression', (assert) => {
  assertThumbnailRenders('/fixtures/peak.geojson', assert, {
    thumbnailEncoding: 'png8:m=h:z=8',
    blendFormat: 'png'
  });
});

tape('renderThumbnail as jpg', (assert) => {
  assertThumbnailRenders('/fixtures/peak.geojson', assert, {
    thumbnailEncoding: 'jpeg80',
    blendFormat: 'jpeg'
  });
});

tape('renderThumbnail with max zoom', (assert) => {
  assertThumbnailRenders('/fixtures/peak.geojson', assert, {
    thumbnailMaxZoom: 4
  });
});
