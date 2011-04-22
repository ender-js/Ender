var colors = require('colors')
  , context = null

  , ENDER = {
      cmd: require('./ender.cmd')
    , jeesh: require('./ender.jeesh')
    , file: require('./ender.file')
    , npm: require('./ender.npm')
    , get: require('./ender.get')
    , util: require('./ender.util')
    , docs: require('./ender.docs')
  },

  API = {

      '.': function () {
        API.refresh.apply(this, arguments);
      }

    , '+': function () {
        API.add.apply(this, arguments);
      }

    , '-b': function () {
        API.build.apply(this, arguments);
      }

    , '-a': function () {
        API.async.apply(this, arguments);
      }

    , '-j': function () {
        API.just.apply(this, arguments);
      }

    , '-h': function () {
        API.help.apply(this, arguments);
      }

    , '-d': function () {
        API.remove.apply(this, arguments);
      }

    , '-i': function () {
        API.info.apply(this, arguments);
      }

    , list: function () {
        API.info.apply(this, arguments);
      }

    , set: function () {
        API.add.apply(this, arguments);
      }

    , welcome: function () {
        console.log("Welcome to ENDER - The no-library library".red);
        console.log("-----------------------------------------");
      }

    , add: function (packages) {
        if (!packages.length) {
          return console.log('error: you must specify a package to add.'.yellow);
        }
        packages = ENDER.util.unique(ENDER.get.special(packages));
        ENDER.get.buildHistory(function (cmd) {
          ENDER.cmd.process(cmd, function (type, _modules) {
            var modules = ENDER.util.unique(ENDER.get.special(_modules));
                queue = ENDER.util.unique(ENDER.util.reject(packages, modules.concat('ender-js')));
            if (!queue.length) {
              return console.log('specified packages already installed.');
            } else {
              context = [type, ENDER.util.unique(ENDER.cmd.normalize(modules.concat(queue))).join(' ')].join(' ');
              if (ENDER.get.buildType(type) == 'just') {
                API.just(modules.concat(queue));
              } else {
                ENDER.npm.install(queue, function (err, out, stderr) {
                  if (err) {
                    console.log('invalid package specified... please check your spelling and try again.'.red);
                    return callback && callback(err);
                  }
                  ENDER.file.assemble(modules.concat(queue), ENDER.get.buildType(type) == 'async', context, function (source) {
                    var built = 0;
                    ENDER.file.output(source, 'ender');
                    ENDER.file.uglify(source, ENDER.file.output, 'ender.min');
                  });
                });
              }
            }
          });
        });
      }

    , remove: function (packages) {
        if (!packages.length) {
          return console.log('error: you must specify a package to remove.'.yellow);
        }
        packages = packages.map(function (item) { return item.replace(/@.*/, ''); });
        packages = ENDER.util.unique(ENDER.get.special(packages));
        ENDER.get.buildHistory(function (cmd) {
          ENDER.cmd.process(cmd, function(type, _modules) {
            var modules = ENDER.util.unique(ENDER.get.special(_modules))
              , queue = ENDER.util.reject(ENDER.util.unique(ENDER.util.keep(
                  packages,
                  modules.map(function (item) { return item.replace(/@.*/, ''); })
                )), ['ender-js']);
            if (!queue.length) {
              return console.log('Nothing to uninstall.');
            } else {
              ENDER.npm.uninstall(queue);
              modules = ENDER.util.reject(modules, queue, true);
              context = [type, ENDER.util.unique(ENDER.cmd.normalize(modules)).join(' ')].join(' ');
              if (ENDER.get.buildType(type) == 'just') {
                API.just(modules);
              } else {
                ENDER.file.assemble(modules, type == '-a' || type == 'async', context, function (source) {
                  var built = 0;
                  ENDER.file.output(source, 'ender');
                  ENDER.file.uglify(source, ENDER.file.output, 'ender.min');
                });
              }
            }
          });
        });
      }

    , info: function () {
        ENDER.get.buildHistory(function (cmd) {
          var packages = [];
          ENDER.cmd.process(cmd, function(type, args) {
            var args = ENDER.util.reject(ENDER.util.unique(ENDER.get.special(args)), ['ender-js']);
            for (var i = 0, l = args.length; i < l; i++) {
              ENDER.npm.desc(args[i], function (description) {
                packages.push(description);
                if (packages.length == args.length) {
                  ENDER.file.enderSize(function (size) {
                    console.log('Your current build type is ' + ('"' + ENDER.get.buildType(type) + '"').yellow);
                    console.log('Your current library size is ' + ((Math.round((size/1024) * 10) / 10) + '').yellow + ' kb\n');
                    console.log('Active packages:')
                    for (var i = 0, l = packages.length; i < l; i++) {
                      var pre = (i == (l - 1)) ? '└' : '├';
                      console.log(pre + '── ' + packages[i]);
                    }
                    console.log(' ');
                  });
                }
              });
            }
          });
        });
      }

    , refresh: function (_type) {
        console.log('refreshing build...');
        ENDER.get.buildHistory(function (cmd) {
          ENDER.cmd.process(cmd, function(type, args) {
            type = (typeof _type == 'string' ? _type : type);
            context = [type, args.join(' ')].join(' ');
            API[type](args);
          });
        });
      }

    , async: function (packages, name, noop, callback) {
        if (packages.length == 1 && packages[0] == '.') {
          return API.refresh('-a');
        }
        packages.unshift('scriptjs');
        API.build.call(this, packages, name, true, callback);
      }

    , just: function (packages, name, noop, callback) {
        if (packages.length == 1 && packages[0] == '.') {
          return API.refresh('-j');
        }
        API.build.call(this, packages, name, false, function () {
          ENDER.file.removeDir('node_modules', function () {
            callback && callback();
          });
        });
      }

    , build: function (packages, name, isAsync, callback) {
        if (!packages.length) {
          return console.log('error: ender build requires packages.'.yellow);
        }
        if (packages.length == 1 && packages[0] == '.') {
          return API.refresh('-b');
        }
        packages = ENDER.util.unique(ENDER.get.special(packages));
        ENDER.npm.install(packages, function (err, out, stderr) {
          if (err) {
            console.log('invalid package specified... please check your spelling and try again.'.red);
            return callback && callback(err);
          }
          ENDER.file.assemble(packages, isAsync, context, function (source) {
            var built = 0, isComplete = function () {
              if (++built === 2) callback && callback();
            };
            ENDER.file.output(source, name || 'ender', isComplete);
            ENDER.file.uglify(source, ENDER.file.output, (name || 'ender') + '.min', isComplete);
          });
        });
      }

    , help: function () {
        console.log(ENDER.docs.overview);
      }

  };


module.exports.exec = function (cmd, name, callback) {
  API.welcome();
  ENDER.cmd.process(cmd, function(type, args) {
    context = [type, args.join(' ')].join(' ');
    API[type](args, name, null, callback);
  });
};