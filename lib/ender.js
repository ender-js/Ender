var colors = require('colors')
  , fs = require('fs')
  , context = null

  , ENDER = {
      cmd: require('./ender.cmd')
    , file: require('./ender.file')
    , npm: require('./ender.npm')
    , search: require('./ender.search')
    , get: require('./ender.get')
    , util: require('./ender.util')
    , docs: require('./ender.docs')
    , closure: require('./ender.closure')
  }

  //define base api
 , API = {

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

    , search: function (terms, options, callback) {
        ENDER.search(terms, options);
      }

    , add: function (packages, options, callback) {
        if (!packages.length) {
          return console.log('error: you must specify a package to add.'.yellow);
        }
        ENDER.get.buildHistory(options.use, function (cmd) {
          ENDER.cmd.process(cmd, function (type, _modules, _options) {
            options = ENDER.util.merge(_options, options);
            !options.sans && (packages = ENDER.util.unique(ENDER.get.special(options).concat(packages)));
            _modules = ENDER.util.unique(ENDER.get.special(options).concat(_modules));
            ENDER.file.constructDependencyTree(_modules, 'node_modules', function (tree) {
              ENDER.file.flattenDependencyTree(tree, null, function (__modules, __uniquePackageNames) {
                ENDER.file.validatePaths(__modules, __uniquePackageNames, function (modules, uniquePackageNames) {
                  var queue = ENDER.util.unique(ENDER.util.reject(packages, uniquePackageNames.concat(ENDER.get.special(options))));
                  if (!queue.length) {
                    return console.log('specified packages already installed.');
                  } else {
                    context = [type, ENDER.util.unique(ENDER.cmd.normalize(_modules.concat(queue))).join(' ')].join(' ') + (options.context || '');
                    ENDER.npm.install(queue, function (err, data) {
                      if (err) {
                        console.log('invalid package specified... please check your spelling and try again.'.red);
                        return callback && callback(err);
                      }
                      ENDER.file.assemble(_modules.concat(queue), options, function (source) {
                        var built = 0, isComplete = function () {
                          if (++built === 2) callback && callback();
                        };
                        ENDER.file.output(source, options.output || options.use,  context, isComplete);
                        ENDER.file.uglify(source, ENDER.file.output, options.output || options.use,  context, isComplete);
                      });
                    });
                  }
                });
              });
            });
          });
        });
      }

    , remove: function (packages, options, callback) {
        if (!packages.length) {
          return console.log('error: you must specify a package to remove.'.yellow);
        }
        ENDER.get.buildHistory(options.use, function (cmd) {
          ENDER.cmd.process(cmd, function(type, _modules, _options) {
            options = ENDER.util.merge(_options, options);
            packages = packages.map(function (item) { return item.replace(/@.*/, ''); });
            !options.sans && (packages = ENDER.util.unique(ENDER.get.special(options).concat(packages)));
            _modules = ENDER.util.unique(ENDER.get.special(options).concat(_modules));
            var modules = ENDER.util.unique(ENDER.get.special(options).concat(_modules))
              , queue = ENDER.util.reject(ENDER.util.unique(ENDER.util.keep(
                  packages,
                  modules.map(function (item) { return item.replace(/@.*/, ''); })
                )), ENDER.get.special(options));
            if (!queue.length) {
              return console.log('Nothing to uninstall.');
            } else {
              ENDER.npm.uninstall(queue, function () {
                 modules = ENDER.util.reject(modules, queue, true);
                  context = [type, ENDER.util.unique(ENDER.cmd.normalize(modules)).join(' ')].join(' ') + (options.context || '');
                  ENDER.file.assemble(modules, options, function (source) {
                    var built = 0, isComplete = function () {
                      if (++built === 2) callback && callback();
                    };
                    ENDER.file.output(source, options.output || options.use, context, isComplete);
                    ENDER.file.uglify(source, ENDER.file.output, options.output || options.use, context, isComplete);
                  });
              });
            }
          });
        });
      }

    , info: function (packages, options) {
        packages = [];
        ENDER.get.buildHistory(options.use, function (cmd) {
          ENDER.cmd.process(cmd, function(type, args, _options) {
            options = ENDER.util.merge(_options, options);
            var args = ENDER.util.unique(args)
              , tree = ENDER.file.constructDependencyTree(args, 'node_modules', function (tree) {
                ENDER.file.enderSize(options.use, function (size) {
                  console.log('Your current build type is ' + ('"' + ENDER.get.buildType(type) + '"').yellow);
                  console.log('Your current library size is ' + ((Math.round((size/1024) * 10) / 10) + '').yellow + ' kb\n');
                  console.log('Active packages:');
                  ENDER.npm.prettyPrintDependencies(tree);
                });
              });
          });
        });
      }

    , refresh: function (_type, options) {
        console.log('refreshing build...');
        ENDER.get.buildHistory(options.use, function (cmd) {
          ENDER.cmd.process(cmd, function(type, args, _options) {
            options = ENDER.util.merge(_options, options);
            type = (typeof _type == 'string' ? _type : type);
            context = [type, args.join(' ')].join(' ') + (options.context || '');
            API[type](args, options);
          });
        });
      }

    , build: function (packages, options, callback) {
        var total = !options.sans ? 2 : 1
        if (!packages.length) {
          return console.log('error: ender build requires packages.'.yellow);
        }
        if (packages.length == 1 && packages[0] == '.') {
          return API.refresh('-b');
        }

        !options.sans && (packages = ENDER.util.unique(ENDER.get.special(options).concat(packages)));

        ENDER.npm.install(packages, function (err, data) {
          if (err) {
            console.log('invalid package specified... please check your spelling and try again.'.red);
            return callback && callback(err);
          }
          ENDER.file.assemble(packages, options, function (source) {
            var built = 0, isComplete = function () {
              if (++built === total) callback && callback();
            };
            ENDER.file.output(source, options.output, context, isComplete);
            ENDER.file.uglify(source, ENDER.file.output, options.output, context, isComplete);
          });
        });
      }

    , help: function (type) {
        if (type.length) console.log(ENDER.docs[type[0]]);
        else console.log(ENDER.docs.overview);
      }

    , compile: function (files, use) {
        console.log('Compiling Ender with ', files.join(' '));
        console.log('This might take a minute...'.yellow);
        use = use && use['use'] ? use['use'] : 'ender'
        ENDER.closure.compile(files, use, function () {
          fs.readFile(use + '-app.js', function (er, out) {
            ENDER.file.gzip(out, function (data) {
              var size = (Math.round((data.length / 1024) * 10) / 10) + 'kb';
              console.log('Success! Your compiled source is ' + (size).cyan + ' and available at ' + use + '-app.js'.green);
            });
          });
        });
      }

  }

 //Export base API methods
 , _API = ENDER.util.merge(module.exports, API);

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
module.exports.exec = function (cmd, callback) {
  API.welcome();
  ENDER.cmd.process(cmd, function(type, args, options) {
    context = [type, args.join(' ')].join(' ') + (options.context || '');
    if (options.help) {
      args = [type];
      type = 'help';
    }
    API[type] ?
      API[type](args, options, callback) :
      console.log('sorry, but the method ' + type.yellow + ' doesn\'t exist ' + ':('.cyan);
  });
}