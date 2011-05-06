var colors = require('colors')
  , context = null

  , ENDER = {
      cmd: require('./ender.cmd')
    , file: require('./ender.file')
    , npm: require('./ender.npm')
    , get: require('./ender.get')
    , util: require('./ender.util')
    , docs: require('./ender.docs')
  },

  //define base api
  API = {

      list: function () {
        API.info.apply(this, arguments);
      }

    , set: function () {
        API.add.apply(this, arguments);
      }

    , welcome: function () {
        console.log("Welcome to ENDER - The no-library library".red);
        console.log("-----------------------------------------");
      }

    , add: function (packages, name, callback) {
        if (!packages.length) {
          return console.log('error: you must specify a package to add.'.yellow);
        }
        packages = ENDER.util.unique(ENDER.get.special(packages));
        ENDER.get.buildHistory(function (cmd) {
          ENDER.cmd.process(cmd, function (type, _modules) {
            ENDER.file.constructDependencyTree(ENDER.util.unique(ENDER.get.special(_modules)), 'node_modules', function (tree) {
              ENDER.file.flattenDependencyTree(tree, null, function (__modules, __uniquePackageNames) {
                ENDER.file.validatePaths(__modules, __uniquePackageNames, function (modules, uniquePackageNames) {
                  var queue = ENDER.util.unique(ENDER.util.reject(packages, uniquePackageNames.concat('ender-js')));
                  if (!queue.length) {
                    return console.log('specified packages already installed.');
                  } else {
                    context = [type, ENDER.util.unique(ENDER.cmd.normalize(_modules.concat(queue))).join(' ')].join(' ');
                    ENDER.npm.install(queue, function (err, out, stderr) {
                      if (err) {
                        console.log('invalid package specified... please check your spelling and try again.'.red);
                        return callback && callback(err);
                      }
                      ENDER.file.assemble(_modules.concat(queue), context, function (source) {
                        var built = 0, isComplete = function () {
                          if (++built === 2) callback && callback();
                        };
                        ENDER.file.output(source, name || 'ender', isComplete);
                        ENDER.file.uglify(source, ENDER.file.output, (name || 'ender') + '.min', isComplete);
                      });
                    });
                  }
                });
              });
            });
          });
        });
      }

    , remove: function (packages, name, callback) {
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
              ENDER.npm.uninstall(queue, function () {
                 modules = ENDER.util.reject(modules, queue, true);
                  context = [type, ENDER.util.unique(ENDER.cmd.normalize(modules)).join(' ')].join(' ');
                  ENDER.file.assemble(modules, context, function (source) {
                    var built = 0, isComplete = function () {
                      if (++built === 2) callback && callback();
                    };
                    ENDER.file.output(source, name || 'ender', isComplete);
                    ENDER.file.uglify(source, ENDER.file.output, (name || 'ender') + '.min', isComplete);
                  });
              });
            }
          });
        });
      }

    , info: function () {
        ENDER.get.buildHistory(function (cmd) {
          var packages = [];
          ENDER.cmd.process(cmd, function(type, args) {
            var args = ENDER.util.reject(ENDER.util.unique(ENDER.get.special(args)), ['ender-js'])
              , tree = ENDER.file.constructDependencyTree(args, 'node_modules', function (tree) {
                ENDER.file.enderSize(function (size) {
                  console.log('Your current build type is ' + ('"' + ENDER.get.buildType(type) + '"').yellow);
                  console.log('Your current library size is ' + ((Math.round((size/1024) * 10) / 10) + '').yellow + ' kb\n');
                  console.log('Active packages:');
                  ENDER.npm.prettyPrintDependencies(tree);
                });
              });
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

    , build: function (packages, name, callback) {
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
          ENDER.file.assemble(packages, context, function (source) {
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

//Export base API methods
var _API = ENDER.util.merge(module.exports, API);

//Extend API with shortcuts for cli
ENDER.util.merge(API, {

    '.': function () {
      _API.refresh.apply(this, arguments);
    }

  , '+': function () {
      _API.add.apply(this, arguments);
    }

  , '-b': function () {
      _API.build.apply(this, arguments);
    }

  , '-h': function () {
      _API.help.apply(this, arguments);
    }

  , '-d': function () {
      _API.remove.apply(this, arguments);
    }

  , 'rm': function () {
      _API.remove.apply(this, arguments);
    }

  , 'ls': function () {
      _API.info.apply(this, arguments);
    }

  , 'list': function () {
      _API.info.apply(this, arguments);
    }

  , '-i': function () {
      _API.info.apply(this, arguments);
    }

});

//Expose exec which can use shorcut flags
module.exports.exec = function (cmd, name, callback) {
  API.welcome();
  ENDER.cmd.process(cmd, function(type, args) {
    context = [type, args.join(' ')].join(' ');
    API[type] ?
      API[type](args, name, callback) :
      console.log('sorry, but the method ' + type.yellow + ' doesn\'t exist ' + ':('.cyan);
  });
}