#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs');
const path = require('path');
const sources = require('../lib/sources');
const styles = require('../lib/styles');
const index = require('../index');
const getStdin = require('get-stdin');

program
  .usage('<input file> <output file>')
  .description('Render a GeoJSON thumbnail')
  .option('--background-satellite')
  .option('--no-padding')
  .option('--background-streets')
  .option('--stylesheet <f>')
  .option('--access-token <t>')
  .option('--min-zoom <n>')
  .option('--max-zoom <n>')
  .parse(process.argv);

function run(inputString, output, minZoom, maxZoom, satellite, streets, stylesheetPath, accessToken, padding) {
  const geojson = JSON.parse(inputString);
  const options = { };

  if (satellite) {
    options.background = { tilejson: sources.mapboxStellite(accessToken || process.env.MapboxAccessToken) };
  } else if (streets) {
    options.background = { tilejson: sources.mapboxStreets(accessToken || process.env.MapboxAccessToken) };
  }

  if (stylesheetPath === 'black') {
    options.stylesheet = styles.black;
  } else if (stylesheetPath) {
    options.stylesheet = fs.readFileSync(path.normalize(stylesheetPath), 'utf8');
  } else {
    options.stylesheet = styles.default;
  }

  if (output.endsWith('.png')) {
    options.format = 'png';
  } else if (output.endsWith('.jpg')) {
    options.format = 'jpeg';
  }

  options.noPadding = !padding;

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

  if (program.args[0] === '-') {
    getStdin().then((str) => {
      run(str, program.args[1], parseInt(program.minZoom), parseInt(program.maxZoom), program.backgroundSatellite, program.backgroundStreets, program.stylesheet, program.accessToken, program.padding);
    });
  } else {
    run(fs.readFileSync(program.args[0]), program.args[1], parseInt(program.minZoom), parseInt(program.maxZoom), program.backgroundSatellite, program.backgroundStreets, program.stylesheet, program.accessToken, program.padding);
  }
}

