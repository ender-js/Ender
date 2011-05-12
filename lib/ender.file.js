var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , rimraf = require('rimraf')
  , uglifyJS = require('uglify-js')
  , commonJSBridge = { head: '!function () { var exports = {}, module = { exports: exports }; '
                     , foot: ' $.ender(module.exports); }.call($);' }
  , UTIL = require('./ender.util')
  , FILE = {

      output: function(data, filename, callback) {
        filename = (filename || 'ender') + '.js';
        fs.writeFile(filename, data, encoding='utf8', function (err) {
          if (err) throw err;
          console.log((filename + ' successfully built!').yellow);
          callback && callback();
        });
      }

    , enderSize: function (file, callback) {
        file = file || 'ender';
        path.exists(file + '.min.js', function (exists) {
          if (!exists) {
            path.exists(file + '.js', function (exists) {
              if (!exists) return console.log(file + ' library doesn\'t exist');
              fs.readFile(file + '.js', 'utf-8', function (err, data) {
                if (err) throw err;
                FILE.gzip(data, function (data) {
                  callback && callback(data.length);
                });
              });
            });
          } else {
            fs.readFile(file + '.min.js', 'utf-8', function (err, data) {
              if (err) throw err;
              FILE.gzip(data, function (data) {
                callback && callback(data.length);
              });
            });
          }
        });
      }

    , gzip: function (_data, callback) {
        gzip(_data, function (err, data) {
          if (err) throw err;
          callback(data);
        });
    }

    , assemble: function (packages, context, options, callback){
        console.log('assembling packages...');
        packages = packages.map(function (item) {
            return item.replace(/@.*/, '');
        });
        FILE.processPackages(packages, context, options, function (result) {
          callback && callback(result.join('\n'));
        });
      }

    , processComment: function (source, context) {
        source = (source && source.toString()) || '/*!\n' +
          '* Ender: open module JavaScript framework\n' +
          '* copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)\n' +
          '* https://ender.no.de\n' +
          '* License MIT\n' +
          '*/\n';

        var i = source.indexOf('* License MIT') + 13,
            start = source.substring(0, i),
            end = source.substring(i);
        return start + '\n  * Build: ender ' + context + end;
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
              callback && callback(paths, uniques);
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
        //clean uniques
        if (callback) {
          uniques = uniques.map(function (n) {
            return n.replace(/^@/, '');
          });
          return callback(packages, uniques);
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
         var packagePath = /\//.test(name) ? path.join(name, 'package.json') :  path.join(dir, name, 'package.json');
          fs.readFile(packagePath, 'utf-8', function (err, data) {
            if (err) throw err;
            var packageJSON = JSON.parse(data)
              , name = packageJSON.name
              , dependencies = packageJSON.dependencies;
            if (dependencies) {
              dependencies = Object.keys(dependencies);
              var _dir = path.join(dir, name, 'node_modules');
              path.exists(_dir, function(exists) {
                if (exists) {
                  fs.readdir(_dir, function (err, filenames) {
                    if (err) throw err;
                    FILE.constructDependencyTree(filenames, _dir, function (result) {
                      tree[name] = result;
                      if (filenames.length != dependencies.length) {
                        UTIL.reject(dependencies, filenames).forEach(function (item) {
                          tree[name][item] = -1;
                        });
                      }
                      if (++x == packages.length) callback(tree);
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
                  if (++x == packages.length) callback && callback(tree);
                }
              });
            } else {
              tree[name] = 0;
              if (++x == packages.length) callback && callback(tree);
            }
          });
        });
      }

    , processPackages: function (_packages, context, options, callback) {
        var result = [], i = 0;
        FILE.constructDependencyTree(_packages, 'node_modules', function (tree) {
          FILE.flattenDependencyTree(tree, null, function (packages) {
            packages = UTIL.unique(packages);
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
                  if (err) throw err;
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
                      if (name == 'ender-js') {
                        source = FILE.processComment(source, context);
                      } else {
                        if (!options.noop) {
                          if (!packageJSON.ender) {
                            source = commonJSBridge.head + source + commonJSBridge.foot;
                          } else if (packageJSON.ender != 'noop'){
                            source += content;
                          }
                        }
                      }
                      result[j] = source;
                      if (packages.length == ++i) {
                        if (options.noop) {
                          result.unshift(FILE.processComment(false, context))
                        }
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
        if (!filePaths.length) return callback && callback();
        filePaths.forEach(function (p) {
          if (!(/\.js$/.test(p))) {
            p += '.js';
          }
          fs.readFile(path.join(packagePath, p), 'utf-8', function (err, data) {
            if (err) throw err;
            result.push(data);
            if (filePaths.length == result.length) {
              callback && callback(result);
            }
          });
        });
      }

    , constructBridge: function (packagePath, bridge, callback) {
        if (!bridge || bridge == 'noop') {
          return callback && callback();
        }
        fs.readFile(path.join(packagePath, bridge), 'utf-8', function (err, data) {
          if (err) throw err;
          callback && callback(data);
        });
      }

    , uglify: function (source, out, filename, callback) {
        try {
          var tok = uglifyJS.parser.tokenizer(source)
            , c = tok()
            , min = FILE.copywrite(c.comments_before) || ''
            , ast = uglifyJS.parser.parse(source);

          ast = uglifyJS.uglify.ast_mangle(ast);
          ast = uglifyJS.uglify.ast_squeeze(ast);
          min += uglifyJS.uglify.gen_code(ast);
          out(min, (filename || 'ender') + '.min', callback);
        } catch (e) {
          console.log('Ender was unable to minify your library with UglifyJS!'.red);
          console.log('This usually means you have a js syntax error in one of your packages.')
        }
      }

    , copywrite: function (comments) { //hack to retain uglify comments
        var ret = "";
        for (var i = 0; i < comments.length; ++i) {
          var c = comments[i];
          if (c.type == "comment1") {
            ret += "//" + c.value + "\n";
          } else {
            ret += "/*" + c.value + "*/";
          }
        }
        return ret + '\n';
      }

    , removeDir: function (dir, callback) {
        rimraf(dir, function (err) {
          if (err) throw err;
          console.log('node_modules directly successfully cleaned up.'.green);
          callback && callback();
        });
      }

};

module.exports = FILE;