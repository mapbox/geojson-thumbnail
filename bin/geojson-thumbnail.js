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
  .option('--background')
  .option('--stylesheet <f>')
  .option('--min-zoom <n>')
  .option('--max-zoom <n>')
  .parse(process.argv);

const run = (input, output, minZoom, maxZoom, hasBackground, stylesheetPath) => {
  const geojson = JSON.parse(fs.readFileSync(input));
  const options = {
    backgroundTileJSON: hasBackground ? sources.mapboxSatellite(process.env.MapboxAccessToken) : null
  };

  if (stylesheetPath) {
    options.stylesheet = fs.readFileSync(path.normalize(stylesheetPath), 'utf8');
  }

  if (output.endsWith('.png')) {
    options.blendFormat = 'png';
  } else if (output.endsWith('.jpg')) {
    options.blendFormat = 'jpeg';
  }

  if (maxZoom) {
    options.thumbnailMaxZoom = maxZoom;
  }
  if (minZoom) {
    options.thumbnailMinZoom = minZoom;
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
  run(program.args[0], program.args[1], program.minZoom, program.maxZoom, program.background, program.stylesheet);
}

