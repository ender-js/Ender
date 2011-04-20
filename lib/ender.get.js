//internal get methods for ender
var jeesh = require('./ender.jeesh')
  , fs = require('fs')
  , path = require('path')
  , typeKey = {
    '-j': 'just',
    'just': 'just',
    '-b': 'build',
    'build': 'build',
    '-a': 'async',
    'async': 'async'
  }

module.exports = {

    buildType: function (what) {
      return typeKey[what];
    },

    special: function (arr) {
      var result = [];
      for (var i = 0, l = arr.length; i <l; i++) {
        if (arr[i] == 'jeesh') {
          result = result.concat(jeesh);
        } else {
          result.push(arr[i]);
        }
      }
      result.unshift('ender-js');
      return result;
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