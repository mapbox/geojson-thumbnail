'use strict';
const tape = require('tape');
const fs = require('fs');
const path = require('path');
const sources = require('../lib/sources');
const index = require('../index');

tape('renderThumbnail', (assert) => {
  const feature = JSON.parse(fs.readFileSync(path.join(__dirname, '/fixtures/water.geojson'), 'utf-8'));
  index.renderThumbnail(feature, (err, image) => {
    assert.ifError(err, 'preview should not fail');
    assert.true(image.length > 10 * 1024, 'preview image should have reasonable image size');
    assert.end();
  }, {
    backgroundTileJSON: sources.naturalEarth()
  });
});
