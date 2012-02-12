// Ender: open module JavaScript framework
// copyright @ded and @fat
// https://ender.no.de
// License MIT
// ==============

process.title = "Ender"

var colors = require('colors')
  , fs = require('fs')
  , async = require('async')
  , context = null
  , version = "v0.8.5"

// ENDER OBJECTS
// =============

  , ENDER = { cmd: require('./ender.cmd')
    , file: require('./ender.file')
    , npm: require('./ender.npm')
    , search: require('./ender.search')
    , get: require('./ender.get')
    , util: require('./ender.util')
    , docs: require('./ender.docs')
    , closure: require('./ender.closure')
    }

// ENDER'S API DEFINITION
// ======================

 , API = module.exports = {

      search: ENDER.search

    , welcome: function () {
        console.log("Welcome to ENDER - The no-library library".red)
        console.log("-----------------------------------------")
      }

    , build: function (packages, options, callback) {
        packages = options.sans ? packages : ENDER.get.special(options).concat(packages)
        packages = ENDER.util.unique(packages)

        async.waterfall([
          async.apply(ENDER.npm.install, packages, options)
        , async.apply(ENDER.file.assemble, packages, options, writeSource)
        , writeSource
        ])

        function writeSource(err, source) {
          async.parallel([
            async.apply(ENDER.file.output, source, options.output, context, options)
          , async.apply(ENDER.file.uglify, source, options.output, context, options)
          ], callback)
        }
      }

    , add: function (newPackages, options, callback) {
        if (!newPackages.length) {
          return console.log('Error: you must specify a package to add.'.yellow)
        }

        newPackages = options.sans ? newPackages : ENDER.get.special(options).concat(newPackages)
        newPackages = ENDER.util.unique(newPackages)

        async.waterfall([
          async.apply(ENDER.get.buildHistory, options.use)
        , ENDER.cmd.process
        , determinePackagesToAdd
        ])

        function determinePackagesToAdd(type, activePackages, activeOptions) {
          options = ENDER.util.merge(activeOptions, options)
          activePackages = ENDER.util.unique(ENDER.get.special(options).concat(activePackages))

          async.waterfall([
            async.apply(ENDER.file.constructDependencyTree, activePackages, 'node_modules')
          , function (tree, callback) { ENDER.file.flattenDependencyTree(tree, null, callback) }
          , ENDER.file.validatePaths
          , function (activePackages, uniqueActivePackageNames) { installPackages(type, activePackages, uniqueActivePackageNames) }
          ])
        }

        function installPackages(type, activePackages, uniqueActivePackageNames) {
          uniqueActivePackageNames = uniqueActivePackageNames.concat(ENDER.get.special(options))
          newPackages = ENDER.util.reject(newPackages, uniqueActivePackageNames)
          newPackages = ENDER.util.unique(newPackages)

          if (!newPackages.length) {
            return console.log('Specified packages already installed.')
          }

          uniqueActivePackageNames = ENDER.util.unique(uniqueActivePackageNames.concat(newPackages))
          context = ENDER.cmd.getContext(type, uniqueActivePackageNames, options.context)

          async.waterfall([
            async.apply(ENDER.npm.install, newPackages, options)
          , async.apply(ENDER.file.assemble, uniqueActivePackageNames, options)
          , writeSource
          ])

          function writeSource(source) {
            async.parallel([
              async.apply(ENDER.file.output, source, options.output, context, options)
            , async.apply(ENDER.file.uglify, source, options.output, context, options)
            ], callback)
          }
        }

      }

    , remove: function (packagesForRemoval, options, callback) {
        if (!packagesForRemoval.length) {
          return console.log('Error: you must specify a package to remove.'.yellow)
        }

        packagesForRemoval = options.sans ? packagesForRemoval : ENDER.get.special(options).concat(packagesForRemoval)

        async.waterfall([
          async.apply(ENDER.get.buildHistory, options.use)
        , ENDER.cmd.process
        , removePackages
        ])

        function removePackages(type, activePackages, activeOptions) {
          options = ENDER.util.merge(activeOptions, options)
          packagesForRemoval = ENDER.npm.stripVersions(packagesForRemoval)
          activePackages = ENDER.npm.stripVersions(ENDER.util.unique(ENDER.get.special(options).concat(activePackages)))
          packagesForRemoval = ENDER.util.unique(ENDER.util.keep(packagesForRemoval, activePackages))
          packagesForRemoval = ENDER.util.reject(packagesForRemoval, ENDER.get.special(options))

          if (!packagesForRemoval.length) {
            console.log('Nothing to uninstall.')
            return callback && callback()
          }

          activePackages = ENDER.util.reject(activePackages, packagesForRemoval, true)
          context = ENDER.cmd.getContext(type, ENDER.util.unique(ENDER.cmd.normalize(activePackages), options.context))

          async.waterfall([
            async.apply(ENDER.npm.uninstall, packagesForRemoval)
          , async.apply(ENDER.file.assemble, activePackages, options)
          , writeSource
          ])
        }

        function writeSource(source) {
          async.parallel([
            async.apply(ENDER.file.output, source, options.output, context, options)
          , async.apply(ENDER.file.uglify, source, options.output, context, options)
          ], callback)
        }
      }

    , info: function (packages, options) {
        async.waterfall([
          async.apply(ENDER.get.buildHistory, options.use)
        , ENDER.cmd.process
        , analyzePackages
        ])

        function analyzePackages(type, activePackages, activeOptions) {
          options = ENDER.util.merge(activeOptions, options)
          activePackages = ENDER.util.unique(activePackages)

          async.series([
            async.apply(ENDER.file.prettyPrintEnderSize, type, options.use)
          , async.apply(ENDER.npm.prettyPrintDependencies, activePackages)
          ])
        }
      }

    , refresh: function (type, options) {
        console.log('refreshing build...')

        async.waterfall([
          async.apply(ENDER.get.buildHistory, options.use)
        , ENDER.cmd.process
        , refreshBuild
        ])

        function refreshBuild(activeType, activePackages, activeOptions) {
           options = ENDER.util.merge(activeOptions, options)
           type = typeof type == 'string' ? type : activeType
           context = ENDER.cmd.getContext(type, activePackages, options.context)
           API[type](activePackages, options);
        }
      }

    , help: function (type) {
        if (type.length) {
          console.log(ENDER.docs[type[0]])
        } else {
          console.log(ENDER.docs.overview)
        }
      }

    , version: function () {
        console.log('Active Version: ' + version)
      }

    , compile: function (files, options) {
        console.log('Compiling Ender with', files.join(' '))
        console.log('This might take a minute...'.yellow)

        async.waterfall([
          async.apply(ENDER.closure.compile, files, options.use)
        , async.apply(fs.readFile, (options.use || 'ender') + '-app.js')
        , ENDER.file.gzip
        , function (data) {
            var size = (Math.round((data.length / 1024) * 10) / 10) + 'kb';
            console.log('Success! Your compiled source is ' + (size).cyan + ' and available at ' + options.use + '-app.js'.green);
          }
        ])
      }

  }

// ALIAS CLI WITH EXTRA METHODS
// ============================

ENDER.util.merge(API, {
  'set': API.add
, 'rm': API.remove
, 'list': API.info
, 'ls': API.info
})

// EXPOSE EXEC FOR CLI
// ===================

module.exports.exec = function (cmd, callback) {

  API.welcome()

  ENDER.cmd.process(cmd, function(err, type, args, options) {

    if (options.help) {
      args = [type]
      type = 'help'
    } else if (type == 'build' && !args.length) {
      args.push('.')
    }

    context = ENDER.cmd.getContext(type, args, options.context)

    if (API[type]) {
      API[type](args, options, callback)
    } else {
      console.log('sorry, but the method ' + type.yellow + ' doesn\'t exist ' + ':('.cyan)
    }

  });

}
