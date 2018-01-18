'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * A default style that visualizes geometries
   * @returns {string} Mapnik Stylesheet
   */
  default: fs.readFileSync(path.normalize(__dirname + '/../styles/default.xml'), 'utf8')
};
