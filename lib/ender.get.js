//internal get methods for ender
var fs = require('fs')
  , path = require('path')
  , typeKey = {
    '-j': 'just',
    'just': 'just',
    '-b': 'build',
    'build': 'build'
  }

module.exports = {

    buildType: function (what) {
      return typeKey[what];
    },

    special: function (arr) {
      arr.unshift('ender-js');
      return arr;
    }

  , buildHistory: function (callback) {
      path.exists('./ender.js', function (exists) {
        if (!exists) {
          path.exists('./ender.min.js', function (exists) {
            if (!exists) return console.log('ender library doesn\'t exist');
            fs.readFile('ender.min.js', 'utf-8', function (err, data) {
              if (err) throw err;
              callback && callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
            });
          });
        } else {
          fs.readFile('ender.js', 'utf-8', function (err, data) {
            if (err) throw err;
            callback && callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
          });
        }
      });
    }

}