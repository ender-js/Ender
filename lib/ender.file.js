var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , rimraf = require('rimraf')
  , uglifyJS = require('uglify-js')
  , commonJSBridge = { head: '!function () { var exports = {}, module = { exports: exports }; '
                     , foot: ' $.ender(module.exports); }();' }
  , UTIL = require('./ender.util')
  , FILE = {

      output: function(data, filename, callback) {
        filename = filename + '.js';
        fs.writeFile(filename, data, encoding='utf8', function (err) {
          if (err) throw err;
          console.log((filename + ' successfully built!').yellow);
          callback && callback();
        });
      }

    , enderSize: function (callback) {
        path.exists('./ender.min.js', function (exists) {
          if (!exists) {
            path.exists('./ender.js', function (exists) {
              if (!exists) return console.log('ender library doesn\'t exist');
              fs.readFile('ender.js', 'utf-8', function (err, data) {
                if (err) throw err;
                FILE.gzip(data, function (data) {
                  callback && callback(data.length);
                });
              });
            });
          } else {
            fs.readFile('ender.min.js', 'utf-8', function (err, data) {
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

    , assemble: function (packages, context, callback){
        console.log('assembling packages...');
        packages = packages.map(function (item) {
            return item.replace(/@.*/, '');
        });
        FILE.processPackages(packages, context, function (result) {
          callback && callback(result.join('\n'));
        });
      }

    , processComment: function (source, context) {
        source = source.toString();
        var i = source.indexOf('* License MIT') + 13,
            start = source.substring(0, i),
            end = source.substring(i);
        return start + '\n  * Build: ender ' + context + end;
      }

    , flattenDependencyTree: function (tree, uniques, callback) {
        uniques = uniques || [];
        var packages = [];
        for (var k in tree) {
          if (~uniques.indexOf(k)) continue;
          if (tree[k]) {
            var flattened = FILE.flattenDependencyTree(tree[k], uniques);
            packages = packages.concat(
              flattened.map(function (name) {
                return [k, name].join('/');
              })
            );
          }
          //using arrays to maintain order o_O
          packages.push(k);
          uniques.push(k);
        }
        return callback && callback(packages, uniques) || packages;
      }

    , constructDependencyTree: function (packages, dir, callback) {
      /* recursively creates something like this
       *  var tree = {
       * 	  somePackage: {
       *		  backbone: {
       *  	    underscore
       *		  },
       * 		  underscore: 0
       * 	  }
       *  };
       */
        var tree = {}, x = 0;
        packages.forEach(function (name) {
          var _dir = path.join(dir, name, 'node_modules');
          path.exists(_dir, function(exists) {
            if (exists) {
              fs.readdir(_dir, function (err, filenames) {
                FILE.constructDependencyTree(filenames, _dir, function (result) {
                  tree[name] = result;
                  if (++x == packages.length) callback(tree);
                });
              });
            } else {
              tree[name] = 0;
              if (++x == packages.length) callback && callback(tree);
            }
          });
        });
      }

    , processPackages: function (_packages, context, callback) {
        var result = [], i = 0;
        FILE.constructDependencyTree(_packages, 'node_modules', function (tree) {
          FILE.flattenDependencyTree(tree, null, function (packages) {
            packages.forEach(function (name, _i) {
              var packagePath = path.join('node_modules', name.replace(/\//g, '/node_modules/'))
                , location = path.join(packagePath, 'package.json');
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
                    } else if (packageJSON.ender && packageJSON.ender != 'noop') {
                      if (packageJSON.ender) {
                        source += content;
                      } else {
                        source = commonJSBridge.head + source + commonJSBridge.foot;
                      }
                    }
                    result[_i] = source;
                    if (packages.length == ++i) {
                       callback && callback(result);
                    }
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

    , uglify: function (source, out, passback, callback) {
        var tok = uglifyJS.parser.tokenizer(source)
          , c = tok()
          , min = FILE.copywrite(c.comments_before) || ''
          , ast = uglifyJS.parser.parse(source);

        ast = uglifyJS.uglify.ast_mangle(ast);
        ast = uglifyJS.uglify.ast_squeeze(ast);
        min += uglifyJS.uglify.gen_code(ast);
        out(min, passback, callback);
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