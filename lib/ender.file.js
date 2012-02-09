var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , async = require('async')
  , uglifyJS = require('uglify-js')
  , ENDER = {
      util: require('./ender.util')
    , get: require('./ender.get')
    }

ENDER.file = module.exports = {

  getComment: function (context) {
    return (
     [ "/*!"
     , "  * ============================================================="
     , "  * Ender: open module JavaScript framework (https://ender.no.de)"
     , "  * Build: ender " + context
     , "  * ============================================================="
     , "  */"
     ].join('\n')
    )
  }

, uglifySource: function (source, callback) {
    try {
      var comments = []
        , token = '"Ender: preserved comment block"'
        , reMultiComments = /\/\*![\s\S]*?\*\//g

        // we add a comma because uglify does too
        , reTokens = RegExp(token + ',', 'g')

        , tok
        , ast
        , c

      source = source.replace(reMultiComments, function(comment) {
        comments.push(comment)
        return ';' + token + ';'
      })

      tok = uglifyJS.parser.tokenizer(source)
      c = tok()
      ast = uglifyJS.parser.parse(source)
      ast = uglifyJS.uglify.ast_mangle(ast)
      ast = uglifyJS.uglify.ast_squeeze(ast)
      source = uglifyJS.uglify.gen_code(ast)

      source = source.replace(reTokens, function() {
        return '\n' + comments.shift() + '\n'
      })

      callback(null, source)
    } catch (e) {
      callback(e)
    }
  }

, uglify: function (source, filename, context, options, callback) {
    ENDER.file.uglifySource(source, function (err, source) {
      if (err) {
        console.log('Ender was unable to minify your library with UglifyJS!'.red)
        return console.log('This usually means you have a js syntax error in one of your packages.')
      }

      filename = filename || 'ender'
      filename += '.min'
      ENDER.file.output(source, filename, context, options, callback)
    })
  }

, output: function(data, filename, context, options, callback) {
    filename = filename || 'ender'
    filename += '.js'

    fs.writeFile(filename, ([ENDER.file.getComment(context), data].join('\n\n')), encoding='utf8', function (err) {
      if (err) {
        if (options.debug) throw err
        console.log('something went wrong trying to write to ' + filename + '.')
        return callback(err)
      }
      console.log((filename + ' successfully built!').yellow)
      callback()
    })
  }

, prettyPrintEnderSize: function (type, file, callback) {
    file = file || 'ender'
    file += '.js'

    path.exists(file, function (exists) {
      if (exists) {
        async.waterfall([
          async.apply(fs.readFile, file, 'utf-8')
        , ENDER.file.uglifySource
        , ENDER.file.gzip
        , writeSize
        ])
      } else if(/\.min\.js$/.test(file)) {
        console.log('Active Ender library couldn\'t be found.')
        callback(new Error)
      } else {
        ENDER.file.prettyPrintEnderSize(type, file.replace(/\.js$/, '.min'), callback)
      }
    })

    function writeSize (data) {
      console.log('Your current build type is ' + ('"' + type + '"').yellow)
      console.log('Your current minified and compressed library size is ' + ((Math.round((data.length/1024) * 10) / 10) + '').yellow + ' kB\n')
      callback && callback()
    }
  }

, createDir: function (dir, callback) {
    path.exists(dir, function(exists) {
      if (!exists) {
        fs.mkdir(dir, 0777, function (err) {
          if (err) {
            callback(err)
            return console.log("something went wrong trying to create your dir :(")
          }
          callback()
        })
      } else {
        callback()
      }
    })
  }

, gzip: function (_data, callback) {
    gzip(_data, function (err, data) {
      if (err) {
        console.log('failed to gzip file')
        callback(err)
      }
      callback(null, data)
    })
  }

, assemble: function (packages, options, callback){
    console.log('assembling packages...')
    packages = packages.map(function (item) { return item.replace(/@.*/, '') })

    ENDER.file.processPackages(packages, options, function (err, result) {
      result = result.join('\n\n')
      if (options.sandbox) {
        result = ['!function () {', result, '}.call({});'].join('\n\n')
      }
      callback(null, result)
    })
  }

, validatePaths: function (paths, uniques, callback) {
    var j = 0
      , k = paths.length
      , fullPath

    paths.forEach(function (packagePath, i) {
      fullPath = path.join('node_modules', packagePath.replace(/\//g, '/node_modules/'))
      path.exists(fullPath, function(exists) {
        if (!exists) {
          i = uniques.indexOf(packagePath)
          paths.splice(i, 1)
          uniques.splice(i, 1)
        }
        if (++j == k) {
          callback(null, paths, uniques)
        }
      })
    })
  }

, flattenDependencyTree: function (tree, uniques, callback) {
    var packages = []
      , flattenedTree
      , packageName
      , cleanPackageName
      , packageValue
      , reg
      , j

    uniques = uniques || []

    for (packageName in tree) {

      if (~uniques.indexOf(packageName)) {
        continue
      }

      packageValue = tree[packageName]

      if (!~packageValue) {
        packageName = '!@' + packageName
      } else if (packageValue) {
        flattenedTree = this.flattenDependencyTree(packageValue, uniques)
        flattenedTree = flattenedTree.map(function (treeItem) {
          if (treeItem.indexOf('!@')) {
            return [packageName, treeItem].join('/')
          } else {
            cleanPackageName = treeItem.replace(/^!@/, '')
            if (~tree[cleanPackageName]) {
              return cleanPackageName
            }
          }
        }).filter(function (item) {
          return item
        })
        packages = packages.concat(flattenedTree)
      }

      packages.push(packageName)
      uniques.push(packageName)
    }

    if (callback) {
      return ENDER.file.orderFlattenedTree(packages, uniques, callback)
    }

    return packages
  }

, orderFlattenedTree: function (packages, uniques, callback) {
    var ordered = []
      , i = 0
      , l = packages.length
      , j
      , packageName
      , packageMatcher
      , lookahead

    for (i; i < l; i++) {
      packageName = packages[i]
      packageMatcher = RegExp('^' + packageName + '(@|$)')

      if (!packageName) {
        continue
      }

      for (j = i + 1; j < l; j++) {
        lookahead = packages[j]
        if (packageMatcher.test(lookahead) && !~ordered.indexOf(lookahead)) {
          ordered.push(lookahead)
          packages[j] = false
        }
      }

      if (!~ordered.indexOf(packageName)) {
        ordered.push(packageName)
      }
    }

    uniques = ordered.map(function (uniquePackage) {
      return uniquePackage.replace(/.*(?=\/.*)\/?/, '')
    })

    callback(null, ordered, uniques)
  }

// Recursive function to create a dependency tree.
//  + 0 == package found, with no dependency
//  + -1 == package not found
//  + object means, file has x dependencies
//
//  Example Obj:
//  ============
//
//  tree = {
// 	  somePackage: {
//		  backbone: {
//  	    underscore: -1
//		  }
// 		, underscore: 0
// 	  }
//  }

, constructDependencyTree: function (packages, dir, callback) {
    var tree = {}
      , x = 0
      , that = this

    packages.forEach(function (packageName) {
      var packageName = packageName.replace(/\@.*/, '')
        , packagePath = /^[\/.]/.test(packageName) ? path.join(packageName, 'package.json') :  path.join(dir, packageName, 'package.json')
        , isInstallingFromRoot = /^\.\/?$/.test(packageName)

      async.waterfall([
        function (cb) { fs.readFile(packagePath, 'utf-8', function (err, data) { if (err) { return ++x } cb(err, data) }) }
      , function (data, cb) { ENDER.file.findDependencies(data, tree, dir, isInstallingFromRoot, cb) }
      , function () { if (++x == packages.length) { callback(null, tree) } }
      ])
    })
  }

, findDependencies: function (data, tree, directory, isInstallingFromRoot, callback) {
    var packageJSON = JSON.parse(data)
      , dependencies = packageJSON.dependencies
      , packageName = packageJSON.name

    if (dependencies && !Array.isArray(dependencies)) {
      dependencies = Object.keys(dependencies)
    }

    if (!dependencies || dependencies.length == 0) {
      tree[packageName] = 0
      return callback(null, tree)
    }

    if (isInstallingFromRoot) {
      return ENDER.file.constructDependencyTree(dependencies, directory, function (err, result) {
        tree = ENDER.util.merge(tree, result)
        callback(null, tree)
      })
    }

    directory = path.join(directory, packageName, 'node_modules')

    path.exists(directory, function (exists) {
      if (exists) {
        return fs.readdir(directory, function (err, filenames) {
          dependencyFromDirectories(err, packageName, directory, filenames)
        })
      } else if (dependencies.length) {
        tree[packageName] = tree[packageName] || {}
        dependencies.forEach(function (item) {
          tree[packageName][item] = -1
        })
      } else {
        tree[packageName] = 0
      }
      callback(null, tree)
    })

    function dependencyFromDirectories(err, packageName, directory, filenames) {
      if (err) {
        console.log('something went wrong while trying to read ' + _dir)
        return callback(err)
      } else {
        //issue #40 ignore dirs != dependencies
        filenames = ENDER.util.keep(filenames, dependencies)
        ENDER.file.constructDependencyTree(filenames, directory, function (err, subTree) {
          tree[packageName] = subTree
          if (filenames.length != dependencies.length) {
            ENDER.util.reject(dependencies, filenames).forEach(function (item) {
              tree[packageName][item] = -1
            })
          }
          callback(null, tree)
        })
      }
    }
  }

, getRootPackageName: function (packages, callback) {
    var packageJSON
      , packageName
      , i
      , l

    for (i = 0, l = packages.length; i < l; i++) {
      packageName = packages[i].replace(/\@.*/, '')
      if (/^\.\/?$/.test(packageName)) {
        return fs.readFile('./package.json', 'utf-8', function (err, data) {
          if (err) {
            callback(err)
            return console.log('something went wrong trying to read ./package.json')
          }
          packageJSON = JSON.parse(data)
          packageName = packageJSON.name
          callback(null, packageName)
        })
      }
    }
    callback(null, false)
  }

, processPackages: function (packages, options, callback) {
    var result = []
      , packagesCompleteCount = 0
      , flattenedPackageLength
      , rootPackageName

    async.waterfall([
      async.apply(ENDER.file.getRootPackageName, packages)
    , function (name, cb) { rootPackageName = name; cb(); }
    , async.apply(ENDER.file.constructDependencyTree, packages, 'node_modules')
    , function (tree, cb) { ENDER.file.flattenDependencyTree(tree, null, cb) }
    , proccessPackageJSONs
    ])

    function proccessPackageJSONs(packages) {
      var clientPosition = packages.indexOf('ender-js')
      flattenedPackageLength = packages.length

      if (clientPosition > 0) { // move ender-js to top if present and not already there
        packages.splice(0, 0, packages.splice(clientPosition, 1)[0])
      }

      packages.forEach(function (packageName, index) {
        var packagePath = packageName == rootPackageName ? '.' : path.join('node_modules', packageName.replace(/\//g, '/node_modules/'))
          , packageJSONLocation = path.join(packagePath, 'package.json')

        path.exists(packageJSONLocation, function (exists) {
          if (!exists) {
            if (++packagesCompleteCount == flattenedPackageLength) {
              callback(result)
            }
            return console.log('The package.json for ' + packageName.red + ' could not be found.')
          }

          fs.readFile(packageJSONLocation, 'utf-8', function (err, data) {
            if (err && options.debug) throw err
            gatherSource(err, packageName, packagePath, index, data, options)
          })
        })
      })
    }

    function gatherSource(err, packageName, packagePath, index, data, options) {
      var packageJSON
        , parallelQue
        , source

      if (err) {
        return console.log('something went wrong trying to read ' + err.path)
      }

      packageJSON = JSON.parse(data)

      if (!packageJSON.main) {
        packageJSON.main = []
      } else if (typeof packageJSON.main == 'string') {
        packageJSON.main = [packageJSON.main]
      }

      parallelQue = {
        source: async.apply(ENDER.file.constructSource, packagePath, packageJSON.main)
      , content: async.apply(ENDER.file.constructBridge, packagePath, packageJSON.ender)
      }

      async.parallel(parallelQue, function (err, results) {
        if (err && options.debug) throw err
        var source = results.source
          , content = results.content
          , strippedName = packageName.replace(/.*(?=\/)\//, '')

        if (source && packageName != 'ender-js' && !options.noop) {
          source = [ '!function () {\n\n  var module = { exports: {} }, exports = module.exports;'
                   , source.replace(/\n/g, '\n  ')
                   , 'provide("' + strippedName + '", module.exports);'
                   ]

          if (options.sandbox && ~options.sandbox.indexOf(strippedName)) {
            source.push('window["' + strippedName + '"] = module.exports;')
          }

          if (packageJSON.ender && content) {
            source.push(content.replace(/\n/g, '\n  '))
          } else if (!packageJSON.ender) {
            source.push('$.ender(module.exports);')
          }

          source = source.join('\n\n  ') + '\n\n}();'
        }

        if (options.sandbox && packageName == 'ender-js') {
          source = ['/* Declare local API */\nvar require, provide, $, ender;\n'
                   , source
                   , '\n/* Set Local API */\nrequire = this.require\nprovide = this.provide\nender = $ = this.ender'
                   ].join('\n')
        }

        result[index] = source

        if (++packagesCompleteCount == flattenedPackageLength) {
          callback && callback(null, result)
        }
      })
    }
  }

, constructSource: function(packagePath, filePaths, callback) {
    var result = []

    if (!filePaths.length) {
      return callback && callback(null, '')
    }

    filePaths.forEach(function (filePath) {
      if (!(/\.js$/.test(filePath))) {
        filePath += '.js'
      }
      fs.readFile(path.join(packagePath, filePath), 'utf-8', function (err, data) {
        if (err) {
          callback(err)
          return console.log('something went wrong trying to read ' + path.join(packagePath, filePath))
        }
        result.push(data)
        if (filePaths.length == result.length) {
          callback && callback(null, result.join('\n\n'))
        }
      })
    })
  }

, constructBridge: function (packagePath, bridge, callback) {
    if (!bridge || bridge == 'noop') {
      return callback && callback(null, '')
    }
    fs.readFile(path.join(packagePath, bridge), 'utf-8', function (err, data) {
      if (err) {
        callback(err)
        return console.log('something went wrong trying to read ' + path.join(packagePath, bridge))
      }
      callback && callback(null, data)
    })
  }

}
