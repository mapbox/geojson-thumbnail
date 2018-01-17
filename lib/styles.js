'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  default: fs.readFileSync(path.normalize(__dirname + '/../styles/default.xml'), 'utf8')
}
