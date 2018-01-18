'use strict';
const tape = require('tape');
const fs = require('fs');
const path = require('path');
const bbox = require('@turf/bbox');

const zoom = require('../lib/zoom');

tape('decideZoom', (assert) => {
  function fixtureBbox(fixturePath) {
    const feature = JSON.parse(fs.readFileSync(path.join(__dirname, fixturePath)));
    return bbox(feature);
  }
  const roadBbox = fixtureBbox('/fixtures/road.geojson');
  assert.deepEqual(zoom.decideZoom(roadBbox), 16, 'road zoom');

  const waterBbox = fixtureBbox('/fixtures/water.geojson');
  assert.deepEqual(zoom.decideZoom(waterBbox), 17, 'water zoom');

  const peakBbox = fixtureBbox('/fixtures/peak.geojson');
  assert.deepEqual(zoom.decideZoom(peakBbox), 17, 'peak zoom');

  const buildingBbox = fixtureBbox('/fixtures/building.geojson');
  assert.deepEqual(zoom.decideZoom(buildingBbox), 17, 'building zoom');

  assert.end();
});

