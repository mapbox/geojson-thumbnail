#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs');
const path = require('path');
const sources = require('../lib/sources');
const index = require('../index');

program
  .usage('<input file> <output file>')
  .description('Render a GeoJSON thumbnail')
  .parse(process.argv);

const run = (input, output) => {
  const geojson = JSON.parse(fs.readFileSync(input));
  const options = {
    backgroundTileJSON: sources.mapboxSatellite(process.env.MapboxAccessToken)
  };

  if (output.endsWith('.png')) {
    options.blendFormat = 'png';
  } else if (output.endsWith('.jpg')) {
    options.blendFormat = 'jpeg';
  }

  index.renderThumbnail(geojson, function onImageRendered(err, image, headers, stats) {
    if (err) throw err;
    fs.writeFile(output, image, (err) => {
      if (err) throw err;
      console.log(
        path.basename(output) + ',',
        stats.requested, 'req,',
        stats.rendered, 'rendered,',
        Math.floor(image.length / 1024), 'kb'
      );
    });
  }, options);
};

if (program.args.length < 2) {
  program.outputHelp();
} else {
  run(program.args[0], program.args[1]);
}

