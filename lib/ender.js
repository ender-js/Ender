 /* ENDER.js
  * by @fat & @ded
  * ============== */

process.title = "Ender"

var colors = require('colors')
  , fs = require('fs')
  , async = require('async')
  , context = null

 /* ENDER OBJECTS
  * ============= */

  , ENDER = { cmd:  require('./ender.cmd')
            , file: require('./ender.file')
            , npm: require('./ender.npm')
            , search: require('./ender.search')
            , get: require('./ender.get')
            , util: require('./ender.util')
            , docs: require('./ender.docs')
            , closure: require('./ender.closure')
    }

 /* ENDER'S API DEFINITION
  * ====================== */

 , API = {

      search: ENDER.search

    , welcome: function () {
        console.log("Welcome to ENDER - The no-library library".red);
        console.log("-----------------------------------------");
      }

    , build: function (packages, options, callback) {
        packages = options.sans ? packages : ENDER.get.special(options).concat(packages)
        packages = ENDER.util.unique(packages);

        ENDER.npm.install(packages, assemblePackages);

        function assemblePackages(err, data) {
          if (err) {
            console.log('invalid package specified... please check your spelling and try again.'.red);
            return callback && callback(err);
          }
          ENDER.file.assemble(packages, options, writeSource);
        }

        function writeSource(source) {
          async.parallel([
            async.apply(ENDER.file.output, source, options.output, context)
          , async.apply(ENDER.file.uglify, source, options.output, context)
          ], callback);
        }
      }

    , add: function (newPackages, options, callback) {
        if (!newPackages.length) {
          return console.log('Error: you must specify a package to add.'.yellow);
        }

        newPackages = options.sans ? newPackages : ENDER.get.special(options).concat(newPackages)
        newPackages = ENDER.util.unique(newPackages);

         async.waterfall([
           function (callback) { ENDER.get.buildHistory(options.use, callback) }
         , ENDER.cmd.process
         , getActivePackages
         ]);


        function getActivePackages(type, activePackages, activeOptions) {
          options = ENDER.util.merge(activeOptions, options);
          activePackages = ENDER.util.unique(ENDER.get.special(options).concat(activePackages));
          async.waterfall([
            function (callback) { ENDER.file.constructDependencyTree(activePackages, 'node_modules', callback); }
          , function (tree, callback) { ENDER.file.flattenDependencyTree(tree, null, callback); }
          , ENDER.file.validatePaths
          , function (activePackages, uniqueActivePackageNames) { installPackages(type, activePackages, uniqueActivePackageNames); }
          ]);
        }

        function installPackages(type, activePackages, uniqueActivePackageNames) {
          uniqueActivePackageNames = uniqueActivePackageNames.concat(ENDER.get.special(options));
          newPackages = ENDER.util.reject(newPackages, uniqueActivePackageNames);
          newPackages = ENDER.util.unique(newPackages);

          if (!newPackages.length) {
            return console.log('Specified packages already installed.');
          }

          context = ENDER.cmd.getContext(type, uniqueActivePackageNames.concat(newPackages), options.context || '')

          API.build(newPackages, options, callback);
        }

      }

    , remove: function (packages, options, callback) {
        if (!packages.length) {
          return console.log('error: you must specify a package to remove.'.yellow);
        }
        ENDER.get.buildHistory(options.use, function (cmd) {
          ENDER.cmd.process(cmd, function(err, type, _modules, _options) {
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
          ENDER.cmd.process(cmd, function(err, type, args, _options) {
            options = ENDER.util.merge(_options, options);
            var args = ENDER.util.unique(args)
              , tree = ENDER.file.constructDependencyTree(args, 'node_modules', function (err, tree) {
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
          ENDER.cmd.process(cmd, function(err, type, args, _options) {
            options = ENDER.util.merge(_options, options);
            type = (typeof _type == 'string' ? _type : type);
            context = [type, args.join(' ')].join(' ') + (options.context || '');
            API[type](args, options);
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
  'set': API.add
, 'rm': API.remove
, 'list': API.info
, 'ls': API.info
, 'list': API.info
});

//Expose exec which can use shorcut flags
module.exports.exec = function (cmd, callback) {
  API.welcome();
  ENDER.cmd.process(cmd, function(err, type, args, options) {
    if (type == 'build' && !args.length) args.push('.');
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