'use strict';
const xml2js = require('xml2js');
const builder = new xml2js.Builder();

function templatizeStylesheet(stylesheet, callback) {
  xml2js.parseString(stylesheet, function onXmlParsed(err, result) {
    if (err) return callback(err);
    const styles = result.Map.Style.filter(function(style) {
      return style['$'].name.startsWith('features');
    });
    const refStyles = [].concat.apply([], result.Map.Layer
      .filter((layer) => layer['$'].name === 'features')
      .map((layer) => layer.StyleName));

    const newTemplate = {
      Map: {
        '$': {
          srs: '+init=epsg:3857',
          'font-directory': result.Map['$']['font-directory']
        },
        FontSet: result.Map.FontSet,
        Style: styles,
        Layer: [{
          '$': { name: 'layer', srs: '+init=epsg:4326' },
          StyleName: refStyles,
          Datasource: {
            Parameter: [
              { '$': { name: 'type' }, '_': 'geojson' },
              { '$': { name: 'inline' }, '_': '{{geojson}}' }
            ]
          }
        }]
      }
    };

    // clean up optional args
    if (!newTemplate.Map['$']['font-directory']) delete newTemplate.Map['$']['font-directory'];
    if (!newTemplate.Map.FontSet) delete newTemplate.Map.FontSet;

    const xml = builder.buildObject(newTemplate).replace('{{geojson}}', '<![CDATA[{{geojson}}]]>');
    callback(null, xml);
  });
}

exports.templatizeStylesheet = templatizeStylesheet;
