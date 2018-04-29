'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * A default style that visualizes geometries
   */
  default: fs.readFileSync(path.normalize(__dirname + '/../styles/default.xml'), 'utf8'),
  /**
   * A style that draws black shapes for geoms
   */
  black: fs.readFileSync(path.normalize(__dirname + '/../styles/black.xml'), 'utf8')
};
