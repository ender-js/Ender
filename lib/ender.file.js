var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , async = require('async')
  , uglifyJS = require('uglify-js')
  , ENDER = {
      util: require('./ender.util')
    , get: require('./ender.get')
    , file: module.exports
    }

module.exports = {

  getComment: function (context) {
    return (
     [ "/*!"
     , "  * ======================================================="
     , "  * Ender: open module JavaScript framework"
     , "  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)"
     , "  * https://ender.no.de"
     , "  * License MIT"
     , "  * Module's individual licenses still apply"
     , "  * Build: ender " + context
     , "  * ======================================================="
     , "  */"
     ].join('\n') + '\n\n'
    )
  }

, uglify: function (source, filename, context, callback) {
    try {
      var comments = [],
        , token = '"Ender: preserved comment block"'
        , reMultiComments = /\/\*![\s\S]*?\*\//g
        , reTokens = RegExp(token, 'g')
        , tok
        , ast
        , c

      filename = filename || 'ender'
      filename += '.min'

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
        return '\n' + comments.shift() + '\n';
      })

      FILE.output(source, filename, context, callback)
    } catch (e) {
      console.log('Ender was unable to minify your library with UglifyJS!'.red);
      console.log('This usually means you have a js syntax error in one of your packages.')
    }
  }

, output: function(data, filename, context, callback) {
    filename = filename || 'ender'
    filename += '.js'

    fs.writeFile(filename, (this.getComment(context) + data), encoding='utf8', function (err) {
      if (err) {
        console.log('Something went wrong trying to write to ' + filename + '.')
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
        async.waterfall({
          async.apply(fs.readFile, file, 'utf-8')
        , ENDER.file.gzip
        , writeSize
        })
      } else if(/\.min\.js$/.test(file)) {
        console.log('Active Ender library couldn\'t be found.')
        callback(new Error)
      } else {
        ENDER.file.prettyPrintEnderSize(type, file.replace(/\.js$/, '.min'), callback)
      }
    })

    function writeSize (err, data) {
      console.log('Your current build type is ' + ('"' + type + '"').yellow)
      console.log('Your current library size is ' + ((Math.round((data.length/1024) * 10) / 10) + '').yellow + ' kb\n')
      callback && callback()
    }
  }

, createDir: function (dir, callback) {
    path.exists(dir, function(exists) {
      if (!exists) {
        fs.mkdir(dir, 0777, function (err) {
          if (err) {
            callback(err)
            return console.log("somethign went wrong trying to create your dir :(")
          }
          callback()
        })
      } else {
        callback()
      }
    });
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

    FILE.processPackages(packages, options, function (err, result) {
      callback(null, result.join('\n\n'))
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
      , packageValue
      , reg
      , j

    uniques = uniques || []

    for (packageName in tree) {
      if (~uniques.indexOf(k)) {
        continue
      }

      packageValue = tree[packageName]

      if (!~packageValue) {
        packageName = '@' + packageName
      } else if (packageValue) {
        flattenedTree = this.flattenDependencyTree(packageValue, uniques)
        flattenedTree = flattenedTree.map(function (treeItem) {
          return treeItem.indexOf('@') ? [packageName, treeItem].join('/') : treeItem.replace(/^@/, '');
        })
        packages = packages.concat(flattenedTree)
      }

      packages.push(packageName)
      uniques.push(packageName)
    }

    if (callback) {
      return orderFlattenedTree(packages, uniques, callback);
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

    while (++i < l) {
      packageName = packages[i]
      packageMatcher = RegExp('^' + packageName)

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
      , packagePath
      , isInstallingFromRoot

    packages.forEach(function (packageName) {
      packageName = packageName.replace(/\@.*/, '')
      packagePath = /^[\/.]/.test(packageName) ? path.join(packageName, 'package.json') :  path.join(dir, packageName, 'package.json')
      isInstallingFromRoot = packageName == '.' || packageName == './'

      async.waterfall({
        async.apply(fs.readFile, packagePath, 'utf-8')
      , function (data, cb) {  findDependencies(data, tree, dir, cb) }
      , function () { if (++x == packages.length) { callback(null, tree) } }
      })
    })
  }

, findDependencies: function (data, tree, directory, callback) {
    var packageJSON
      , dependencies
      , packageJSON
      , dependencies

    if (err) {
      return console.log('something went wrong while trying to read ' + packagePath);
    }

    packageJSON = JSON.parse(data)
    packageName = packageJSON.name
    dependencies = packageJSON.dependencies

    if (!dependencies) {
      tree[packageName] = 0
      return callback(null, tree)
    }

    dependencies = Object.keys(dependencies)

    if (isInstallingFromRoot) {
      return ENDER.file.constructDependencyTree(dependencies, dir, function (err, result) {
        tree = ENDER.util.merge(tree, result)
        callback(null, tree)
      })
    }

    directory = path.join(directory, packageName, 'node_modules')

    path.exists(directory, function (exists) {
      if (exists) {
        return fs.readdir(directory, function () {
          dependencyFromDirectory (directory, filenames)
        })
      } else if (dependencies.length) {
        tree[packageName] = tree[packageName] || {};
        dependencies.forEach(function (item) {
          tree[name][item] = -1;
        });
      } else {
        tree[packageName] = 0;
      }
      callback(null, tree)
    })

    function dependencyFromDirectories(directory, filenames) {
      if (err) {
        console.log('something went wrong while trying to read ' + _dir)
        return callback(err)
      } else {
        //issue #40 ignore dirs != dependencies
        filenames = ENDER.util.keep(filenames, dependencies)
        ENDER.file.constructDependencyTree(filenames, directory, function (err, subTree) {
          tree[packageName] = subTree
          if (filenames.length != dependencies.length) {
            UTIL.reject(dependencies, filenames).forEach(function (item) {
              tree[packageName][item] = -1
            });
          }
          callback(null, tree)
        })
      }
    }
  }


, processPackages: function (packages, options, callback) {
    var result = []
      , packagesCompleteCount

    async.waterfall({
      async.apply(ENDER.file.constructDependencyTree, packages, 'node_modules')
    , function (tree, cb) { ENDER.file.flattenDependencyTree(tree, null, cb)}
    , proccessPackageJSONs
    })

    function proccessPackageJSONs(packages) {
      packages.forEach(function (packageName, index) {
        var packagePath = path.join('node_modules', packageName.replace(/\//g, '/node_modules/'))
          , packageJSONLocation = path.join(packagePath, 'package.json')

        path.exists(packageJSONLocation, function (exists) {
          if (!exists) {
            if (packages.length == ++packagesCompleteCount) {
              callback(result)
            }
            return console.log('The package.json for ' + name.red + ' could not be found.'.yellow)
          }

          fs.readFile(location, 'utf-8', function (err, data) { gatherSource(packageName, index, data) })
        })
      })
    }

    function gatherSource(packageName, index, data) {
      var packageJSON
        , parallelQue
        , source

      if (err) {
        return console.log('something whent wrong trying to read ' + err.path);
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
        var source = results.source
          , content = results.content

        if (source && packageName != 'ender-js' && !options.noop) {
          source = [ '!function () {\n\n  var module = { exports: {} }, exports = module.exports;'
                   , source.replace(/\n/g, '\n  ')
                   , 'provide("' + packageName.replace(/.*(?=\/)\//, '') + '", module.exports);'
                   ]
          if (packageJSON.ender) {
            source.push(content.replace(/\n/g, '\n  '))
          } else {
            source.push('$.ender(module.exports);')
          }
          source = source.join('\n\n  ') + '\n\n}();'
        }

        result[index] = source

        if (packages.length == ++packagesCompleteCount) {
          callback && callback(null, result)
        }
      })
  }

, constructSource: function(packagePath, filePaths, callback) {
    var result = []

    if (!filePaths.length) {
      return callback && callback(null, '')
    }

    filePaths.forEach(function (filePath) {
      if (!(/\.js$/.test(filePath))) {
        filePath += '.js';
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
      return callback && callback(null, '');
    }
    fs.readFile(path.join(packagePath, bridge), 'utf-8', function (err, data) {
      if (err) {
        callback(err)
        return console.log('somethign went wrong trying to read ' + path.join(packagePath, bridge))
      }
      callback && callback(data)
    })
  }

}