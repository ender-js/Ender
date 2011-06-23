//internal get methods for ender
var fs = require('fs')
  , path = require('path')
  , typeKey = {
    '-b': 'build',
    'build': 'build'
  }

module.exports = {

    buildType: function (what) {
      return typeKey[what];
    },

    special: function (options) {
      return options.sans || options.noop ? [] : ['ender-js'];
    }

  , buildHistory: function (file, callback) {
      file = file || 'ender';
      path.exists(file + '.js', function (exists) {
        if (!exists) {
          path.exists(file + '.min.js', function (exists) {
            if (!exists) return console.log(file + ' library doesn\'t exist');
            fs.readFile(file + '.min.js', 'utf-8', function (err, data) {
              if (err) return console.log('something went wrong trying to read ' + file);
              callback && callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
            });
          });
        } else {
          fs.readFile(file + '.js', 'utf-8', function (err, data) {
            if (err) return console.log('something went wrong tring to read' + file + '.js');
            callback && callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
          });
        }
      });
    }

}