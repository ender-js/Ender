/*COMMAND METHODS*/
var UTIL = require('./ender.util');

module.exports = {

    process: function (cmd, callback) {
      var args = typeof cmd == 'string' ? cmd.split(' ').slice(1) : cmd.slice(2)
        , type = args.shift();
      // Display the help message by default.
      callback(type && type.toLowerCase() || 'help', args.join(',').replace(/\s|\,(?=\,)/g,'').split(',').filter(function(x){return x !== '';}));
    }

  , normalize: function (packages) {
      return UTIL.reject(packages, ['ender-js']);
    }

};
