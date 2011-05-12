/*COMMAND METHODS*/
var UTIL = require('./ender.util');

module.exports = {

    process: function (cmd, callback) {
      var args = typeof cmd == 'string' ? cmd.split(' ').slice(1) : cmd.slice(2)
        , type = args.shift()
        , options = {};

      for (var i = args.length; i--;) {
        if (args[i] == '-o' || args[i] == '--output') {
          options['output'] = args[i + 1];
          args.splice(i, 2);
        } else if (args[i] == '--noop' || args[i] == '-x'){
          options['noop'] = true;
          args.splice(i, 1);
        } else if (args[i] == '--use' || args[i] == '-u') {
          options['use'] = args[i + 1];
          args.splice(i, 2);
        }  else if (args[i] == '--silent' || args[i] == '-s') {
          options['silent'] = true;
          args.splice(i, 1);
        }
      }

      var context = '';
      for (var i in options) {
        if (options.hasOwnProperty(i)) {
          context += ' --' + i + (typeof options[i] == 'string' ? ' ' + options[i] : '');
        }
      }
      options.context = context;

      callback(
        type && type.toLowerCase() || 'help',
        args.join(',').replace(/\s|\,(?=\,)/g,'').split(',').filter(function(x){return x !== '';}),
        options
      );
    }

  , normalize: function (packages) {
      return UTIL.reject(packages, ['ender-js']);
    }

};
