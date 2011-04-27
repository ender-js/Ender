var fs = require('fs')
  , path = require('path')
  , gzip = require('gzip')
  , rimraf = require('rimraf')
  , uglifyJS = require('uglify-js')
  , commonJSBridge = { head: '!function () { var exports = {}, module = { exports: exports }; '
                     , foot: ' $.ender(module.exports); }();' }
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

    , assemble: function (packages, _isAsync, context, callback){
        console.log('assembling packages...');
        packages = packages.map(function (item) {
            return item.replace(/@.*/, '');
        });
        FILE.processPackages(packages, _isAsync, context, function (_sync, _async, _asyncBridges) {
          var result = _sync.join('\n');
          if (_isAsync) {
            result += '\n\n' +
              '$.require([' + _async.join(',') + '], "ender");\n' +
              '$.ready("ender", function () { \n' +
                _asyncBridges.join('\n\n') +
              '\n});';
          }
          callback && callback(result);
        });
      }

    , processComment: function (source, context) {
        source = source.toString();
        var i = source.indexOf('* License MIT') + 13,
            start = source.substring(0, i),
            end = source.substring(i);
        return start + '\n  * Build: ender ' + context + end;
      }

    , processPackages: function (packages, _isAsync, context, callback) {
        var _sync = [], _async = [], _asyncBridges = [], i = 0;
        packages.forEach(function (name) {
          var location = path.join('node_modules', name, 'package.json');
          fs.readFile(location, 'utf-8', function (err, data) {
            if (err) throw err;
            var packageJSON = JSON.parse(data)
            , isAsync = /ender\-js|scriptjs/.test(name) || !packageJSON.ender ? false : _isAsync
            , source;
            //CONSTRUCT MAIN SOURCE FILE
            if (!packageJSON.main) {
              return console.log(name + ' source not found');
            } else if (typeof packageJSON.main == 'string') {
              packageJSON.main = [ packageJSON.main ];
            }
            FILE.constructSource(isAsync, _async, name, packageJSON.main, function (result) {
              if (!isAsync) {
                source = result;
              } else {
                _async = result;
              }
              //CONSTRUCT BRIDGE
              FILE.constructBridge(name, packageJSON.ender, function (content) {
                if (name == 'ender-js') {
                  source = FILE.processComment(source, context);
                } else {
                  if (packageJSON.ender) {
                    isAsync ? _asyncBridges.push(content) : (source += content);
                  } else if (!isAsync) {
                    source = commonJSBridge.head + source + commonJSBridge.foot;
                  }
                }
                if (!isAsync) {
                  _sync.push(source);
                }
                if (packages.length == ++i) {
                   callback && callback(_sync, _async, _asyncBridges);
                }
              });
            });
          });
        });
      }

    , constructSource: function(isAsync, _async, name, filePaths, callback) {
        var result = [];
        if (!isAsync) {
          filePaths.forEach(function (p) {
            if (!(/\.js$/.test(p))) {
              p += '.js';
            }
            fs.readFile(path.join('node_modules', name, p), 'utf-8', function (err, data) {
              if (err) throw err;
              result.push(data);
              if (filePaths.length == result.length) {
                callback && callback(result);
              }
            });
          });
        } else {
          callback && callback(_async.concat(filePaths.map(function (p) {
            return '"' + path.join('node_modules', name, p) + '"';
          })));
        }
      }

    , constructBridge: function (name, bridge, callback) {
        if (name == 'ender-js' || !bridge) {
          return callback && callback();
        }
        fs.readFile(path.join('node_modules', name, bridge), 'utf-8', function (err, data) {
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