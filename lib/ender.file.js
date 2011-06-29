var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , rimraf = require('rimraf')
  , uglifyJS = require('uglify-js')
  , commonJSBridge = { head: '!function () {\n\n  var module = { exports: {} }, exports = module.exports;'
                     , foot: ' $.ender(module.exports); }.call($);' }
  , UTIL = require('./ender.util')
  , FILE = {

      output: function(data, filename, context, callback) {
        filename = (filename || 'ender') + '.js';
        fs.writeFile(filename, (FILE.processComment(context) + data), encoding='utf8', function (err) {
          if (err) return console.log('somethign when wrong trying to write to ' + filename);
          console.log((filename + ' successfully built!').yellow);
          callback && callback();
        });
      }

    , uglify: function (source, filename, context, callback) {
        try {
          var tok = uglifyJS.parser.tokenizer(source)
            , c = tok()
            , ast = uglifyJS.parser.parse(source);
          ast = uglifyJS.uglify.ast_mangle(ast);
          ast = uglifyJS.uglify.ast_squeeze(ast);
          FILE.output(uglifyJS.uglify.gen_code(ast), (filename || 'ender') + '.min', context, function () {
            callback();
            console.log("** WARNING: UglifyJS DISCARDS ALL COMMENTS **".red);
          });
        } catch (e) {
          console.log('Ender was unable to minify your library with UglifyJS!'.red);
          console.log('This usually means you have a js syntax error in one of your packages.')
        }
      }

    , enderSize: function (file, callback) {
        file = file || 'ender';
        path.exists(file + '.min.js', function (exists) {
          if (!exists) {
            path.exists(file + '.js', function (exists) {
              if (!exists) return console.log(file + ' library doesn\'t exist');
              fs.readFile(file + '.js', 'utf-8', function (err, data) {
                if (err) return console.log('something went wrong trying to read ' + file + '.js');
                FILE.gzip(data, function (data) {
                  callback && callback(data.length);
                });
              });
            });
          } else {
            fs.readFile(file + '.min.js', 'utf-8', function (err, data) {
              if (err) return console.log('something went wrong tyring to read ' + file + '.min.js');
              FILE.gzip(data, function (data) {
                callback && callback(data.length);
              });
            });
          }
        });
      }

    , gzip: function (_data, callback) {
        gzip(_data, function (err, data) {
          if (err) return console.log('failed to gzip file');
          callback(data);
        });
    }

    , assemble: function (packages, options, callback){
        console.log('assembling packages...');
        packages = packages.map(function (item) {
            return item.replace(/@.*/, '');
        });
        FILE.processPackages(packages, options, function (result) {
          callback && callback(result.join('\n\n'));
        });
      }

    , processComment: function (context) {
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
        );
      }

    , validatePaths: function (paths, uniques, callback) {
        var j = 0, k = paths.length;
        paths.forEach(function (name, i) {
          path.exists(path.join('node_modules', name.replace(/\//g, '/node_modules/')), function(exists) {
            if (!exists) {
              i = uniques.indexOf(name);
              paths.splice(i, 1);
              uniques.splice(i, 1);
            };
            if (++j == k) {
              callback && callback(null, paths, uniques);
            }
          });
        });
      }

    , flattenDependencyTree: function (tree, uniques, callback) {
        uniques = uniques || [];
        var packages = [];
        for (var k in tree) {
          if (~uniques.indexOf(k)) continue;
          if (tree[k] == -1) {
            k = '@' + k;
          } else if (tree[k]) {
            var flattened = FILE.flattenDependencyTree(tree[k], uniques);
              packages = packages.concat(
                flattened.map(function (name) {
                  if (!name.indexOf('@')) {
                    return name.replace(/^@/, '');
                  }
                  return [k, name].join('/');
                })
              );
          }
          //using arrays to maintain order o_O
          packages.push(k);
          uniques.push(k);
        }

        if (callback) {

          //* re order deps *//
          var ordered = [];
          for (var i = 0, l = packages.length; i < l; i++) {
            if (!packages[i]) continue;
            var j, reg = RegExp('^' + packages[i]);
            for (j = i + 1; j < l; j++) {
              if (reg.test(packages[j]) && !~ordered.indexOf(packages[j])) {
                ordered.push(packages[j]);
                packages[j] = false;
              }
            }
            if (!~ordered.indexOf(packages[i])) ordered.push(packages[i]);
          }

          uniques = ordered.map(function (item) {
            return item.replace(/.*(?=\/.*)\/?/, '');
          });

          return callback(null, ordered, uniques);
        }
        return packages;
      }

    , constructDependencyTree: function (packages, dir, callback) {
      /* recursively creates something like this
       *  var tree = {
       * 	  somePackage: {
       *		  backbone: {
       *  	    underscore: -1
       *		  },
       * 		  underscore: 0
       * 	  }
       *  };
       */
        var tree = {}, x = 0;
        packages.forEach(function (name) {
          name = name.replace(/\@.*/, ''); // remove version from packagename

          var packagePath = /^[\/.]/.test(name) ? path.join(name, 'package.json') :  path.join(dir, name, 'package.json')
            , isRoot = name == '.' || name == './';

          fs.readFile(packagePath, 'utf-8', function (err, data) {
            if (err) return console.log('something went wrong while trying to read ' + packagePath);

            var packageJSON = JSON.parse(data)
              , name = packageJSON.name
              , dependencies = packageJSON.dependencies;

            if (dependencies) {
              dependencies = Object.keys(dependencies);

              //if installing from local package.json
              if (isRoot) {
                return FILE.constructDependencyTree(dependencies, dir, function (err, result) {
                  tree = UTIL.merge(tree, result);
                  if (++x == packages.length) callback && callback(null, tree);
                });
              }

              var _dir = path.join(dir, name, 'node_modules');
              path.exists(_dir, function(exists) {
                if (exists) {
                  fs.readdir(_dir, function (err, filenames) {
                    if (err) return console.log('something went wrong while trying to read ' + _dir);
                    filenames = UTIL.keep(filenames, dependencies); //issue #40 ignore dirs != dependencies
                    FILE.constructDependencyTree(filenames, _dir, function (err, result) {
                      tree[name] = result;
                      if (filenames.length != dependencies.length) {
                        UTIL.reject(dependencies, filenames).forEach(function (item) {
                          tree[name][item] = -1;
                        });
                      }
                      if (++x == packages.length) callback && callback(null, tree);
                    });
                  });
                } else {
                  if (dependencies.length) {
                    tree[name] = tree[name] || {};
                    dependencies.forEach(function (item) {
                      tree[name][item] = -1;
                    });
                  } else {
                    tree[name] = 0;
                  }
                  if (++x == packages.length) callback && callback(null, tree);
                }
              });
            } else {
              tree[name] = 0;
              if (++x == packages.length) callback && callback(null, tree);
            }
          });
        });
      }

    , processPackages: function (_packages, options, callback) {
        var result = [], i = 0;
        FILE.constructDependencyTree(_packages, 'node_modules', function (err, tree) {
          FILE.flattenDependencyTree(tree, null, function (err, packages) {
            packages.forEach(function (name, j) {
              var packagePath = path.join('node_modules', name.replace(/\//g, '/node_modules/'))
                , location = path.join(packagePath, 'package.json');
              path.exists(location, function (exists) {
                if (!exists) {
                  console.log('dependency ' + name.red + ' is currently not installed... for details check: ' + '$ ender info'.yellow);
                  if (packages.length == ++i) {
                     callback && callback(result);
                  }
                  return;
                }
                fs.readFile(location, 'utf-8', function (err, data) {
                  if (err) return console.log('something whent wrong trying to read ' + location);
                  var packageJSON = JSON.parse(data)
                  , source;
                  //CONSTRUCT MAIN SOURCE FILE
                  if (!packageJSON.main) {
                    packageJSON.main = [];
                  } else if (typeof packageJSON.main == 'string') {
                    packageJSON.main = [ packageJSON.main ];
                  }
                  FILE.constructSource(packagePath, packageJSON.main, function (source) {
                    //CONSTRUCT BRIDGE
                    FILE.constructBridge(packagePath, packageJSON.ender, function (content) {
                      if (source && name !== 'ender-js' && !options.noop) {
                        source = [
                            commonJSBridge.head
                          , source.replace(/\n/g, '\n  ')
                          , 'provide("' + name.replace(/.*(?=\/)\//, '') + '", module.exports);'
                        ];
                        if (packageJSON.ender) source.push(content.replace(/\n/g, '\n  '));
                        else source.push('$.ender(module.exports);')
                        source = source.join('\n\n  ') + '\n\n}();';
                      }
                      result[j] = source;
                      if (packages.length == ++i) {
                        callback && callback(result);
                      }
                    });
                  });
                });
              });
            });
          });
        });
      }

    , constructSource: function(packagePath, filePaths, callback) {
        var result = [];
        if (!filePaths.length) return callback && callback('');
        filePaths.forEach(function (p) {
          if (!(/\.js$/.test(p))) {
            p += '.js';
          }
          fs.readFile(path.join(packagePath, p), 'utf-8', function (err, data) {
            if (err) return console.log('something went wrong trying to read ' + path.join(packagePath, p));
            result.push(data);
            if (filePaths.length == result.length) {
              callback && callback(result.join('\n\n'));
            }
          });
        });
      }

    , constructBridge: function (packagePath, bridge, callback) {
        if (!bridge || bridge == 'noop') {
          return callback && callback('');
        }
        fs.readFile(path.join(packagePath, bridge), 'utf-8', function (err, data) {
          if (err) return console.log('somethign went wrong trying to read ' + path.join(packagePath, bridge));
          callback && callback(data);
        });
      }

    , removeDir: function (dir, callback) {
        rimraf(dir, function (err) {
          if (err) return console.log('problem trying to remove ' + dir);
          console.log('node_modules directly successfully cleaned up.'.green);
          callback && callback();
        });
      }

};

module.exports = FILE;
