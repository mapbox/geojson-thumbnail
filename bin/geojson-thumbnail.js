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
  .option('--background-satellite')
  .option('--background-streets')
  .option('--stylesheet <f>')
  .option('--min-zoom <n>')
  .option('--max-zoom <n>')
  .parse(process.argv);

function run(input, output, minZoom, maxZoom, satellite, streets, stylesheetPath) {
  const geojson = JSON.parse(fs.readFileSync(input));
  const options = { };

  if (satellite) {
    options.background = { tilejson: sources.mapboxStellite(process.env.MapboxAccessToken) };
  } else if (streets) {
    options.background = { tilejson: sources.mapboxStreets(process.env.MapboxAccessToken) };
  }

  if (stylesheetPath) {
    options.stylesheet = fs.readFileSync(path.normalize(stylesheetPath), 'utf8');
  }

  if (output.endsWith('.png')) {
    options.format = 'png';
  } else if (output.endsWith('.jpg')) {
    options.format = 'jpeg';
  }

  if (maxZoom) {
    options.maxzoom = maxZoom;
  }
  if (minZoom) {
    options.minzoom = minZoom;
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
}

if (program.args.length < 2) {
  program.outputHelp();
} else {
  run(program.args[0], program.args[1], parseInt(program.minZoom), parseInt(program.maxZoom), program.backgroundSatellite, program.backgroundStreets, program.stylesheet, program.accessToken);
}

