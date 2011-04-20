var fs = require('fs')
  , path = require('path')
  , rimraf = require('rimraf')
  , exec = require('child_process').exec
  , uglifyJS = require('uglify-js');
    require('colors');

var jeesh = ['domready', 'klass', 'scriptjs', 'qwery', 'bonzo', 'bean', 'reqwest', 'emile', 'underscore'];

var commonJSBridge = {
    head: '!function () { var module = { exports: {} }; '
  , foot: ' $.ender(module.exports); }();'
};

/*
 * ENDER PUBLIC API -----------------------------------
 */

var ENDER = {

    cmd: null, //<-- ie: -b bean bonzo qwery

    '.': function () {
      ENDER.refresh.apply(this, arguments);
    },

    '+': function () {
      ENDER.add.apply(this, arguments);
    },

    '-b': function () {
      ENDER.build.apply(this, arguments);
    }

  , '-a': function () {
      ENDER.async.apply(this, arguments);
    }

  , '-j': function () {
      ENDER.just.apply(this, arguments);
    }

  , '-h': function () {
      ENDER.help.apply(this, arguments);
    }

  , '-d': function () {
      ENDER.remove.apply(this, arguments);
    }

  , '-i': function () {
      ENDER.info.apply(this, arguments);
    }

  , welcome: function () {
      console.log("Welcome to ENDER - The no-library library".red);
      console.log("-----------------------------------------");
    }

  , add: function (packages) {
      var self = this;
      if (!packages.length) {
        return console.log('error: you must specify a package to add.'.yellow);
      }
      packages = unique(special(packages));
      getHistory(function (cmd) {
        processCommand(cmd, function(type, _modules) {
          var modules = unique(special(_modules));
              newPackages = [];
          for (var i = packages.length; i--;) {
            if (packages[i] != 'ender-js' && modules.indexOf(packages[i]) == -1) {
              newPackages.push(packages[i]);
            }
          }
          newPackages = unique(newPackages);
          if (!newPackages.length) {
            return console.log('specified packages already installed.');
          } else {
            _modules = _modules.concat(newPackages)
            if (containsAll(_modules, jeesh)) {
              _modules = reject(modules, jeesh);
              _modules.unshift('jeesh');
              var hasEnder = _modules.indexOf('ender-js');
              if (hasEnder > -1) _modules.splice(hasEnder, 1);
            }
            ENDER.cmd = [type, _modules.join(' ')].join(' ');
            ENDER[type].call(self, modules.concat(newPackages));
          }
        });
      });
    }

  , remove: function (packages) {
      var self = this;
      if (!packages.length) {
        return console.log('error: you must specify a package to remove.'.yellow);
      }
      packages = unique(special(packages));
      getHistory(function (cmd) {
        processCommand(cmd, function(type, _modules) {
          var modules = unique(special(_modules));
              queue = [];
          for (var i = packages.length; i--;) {
            if (packages[i] != 'ender-js' && modules.indexOf(packages[i]) > -1) {
              queue.push(packages[i]);
            }
          }
          queue = unique(queue);
          if (!queue.length) {
            return console.log('Nothing to uninstall.');
          } else {
            console.log('uninstalling ' + queue.join(' ').yellow);
            exec('npm uninstall ' + queue.join(' '), function (err) {
              if (err) throw err;
            });
            modules = reject(modules, queue);
            if (containsAll(modules, jeesh)) {
              _modules = reject(modules, jeesh);
              _modules.unshift('jeesh');
            } else {
              _modules = modules;
            }
            var hasEnder = _modules.indexOf('ender-js');
            if (hasEnder > -1) _modules.splice(hasEnder, 1);
            ENDER.cmd = [type, _modules.join(' ')].join(' ');
            ENDER[type].call(self, modules);
          }
        });
      });
    }

  , info: function () {
      getHistory(function (cmd) {
        var packages = [];
        processCommand(cmd, function(type, args) {
          var args = unique(special(args));
          for (var i = 0, l = args.length; i < l; i++) {
            npmDecription(args[i], function (description) {
              packages.push(description);
              if (packages.length == args.length) {
                activeFileSize(function(size) {
                  outputList(type, size, packages);
                });
              }
            })
          }
        });
      });
    }

  , refresh: function (_type) {
      console.log('refreshing build...');
      getHistory(function (cmd) {
        processCommand(cmd, function(type, args) {
          ENDER.cmd = [(_type || type), args.join(' ')].join(' ');
          ENDER[_type || type](args);
        });
      });
    }

  , async: function (packages, name, noop, callback) {
      if (packages.length == 1 && packages[0] == '.') {
        return ENDER.refresh('-a');
      }
      packages.unshift('scriptjs');
      ENDER.build.call(this, packages, name, true, callback);
    }

  , just: function (packages, name, noop, callback) {
      ENDER.build.call(this, packages, name, false, function () {
        rimraf('node_modules', function (err) {
          if (err) throw err;
          console.log('node_modules directly successfully cleaned up.'.green);
          callback && callback();
        });
      });
    }

  , build: function (packages, name, isAsync, callback) {
      if (!packages.length) {
        return console.log('error: ender build requires packages.'.yellow);
      }
      if (packages.length == 1 && packages[0] == '.') {
        return ENDER.refresh('-b');
      }
      packages = unique(special(packages));
      npmInstall(packages, function (err, out, stderr) {
        if (err) {
          console.log('invalid package specified... please check your spelling and try again.'.red);
          return callback && callback(err);
        }
        assemble(packages, isAsync, function (source) {
          var built = 0
            , isComplete = function () {
                if (++built === 2) callback && callback();
              };
          output(source, name || 'ender', isComplete);
          uglify(source, output, (name || 'ender') + '.min', isComplete);
        });
      });
    }

  , help: function () {
      console.log(
        '\nMethods\n'.red +
        '-------\n' +
        '- build:\n'.yellow +
        '  + accepts multiple npm packages to build into ender library\n' +
        '  + example: $ ender build domready,qwery,bean\n' +
        '  + note: alternatively you can specify the -b flag\n' +
        '\n' +
        '- just:\n'.yellow +
        '  + accepts multiple npm packages to build into ender library + cleans up node_modules folder after its finished\n' +
        '  + example: $ ender build domready,qwery,bean\n' +
        '  + note: alternatively you can specify the -b flag\n' +
        '\n' +
        '- async:\n'.yellow +
        '  + creates an asyncronously loaded ender library (automatically includes scriptjs for loading)\n' +
        '  + example: $ ender async domready,qwery,bean\n' +
        '  + note: alternatively you can specify the -a flag\n\n' +
        'General Help\n'.red +
        '------------\n' +
        'If you get stuck please visit ' + 'http://github.com/ender-js/Ender'.yellow + ' and file an issue.\n\n' +
        'You may also want to consider @messaging ' + '@fat'.yellow + ' or ' + '@ded'.yellow + ' on twitter directly\n'
        );
    }

};

/* END ENDER PUBLIC API -----------------------------------*/

/* ENDER METHODS */
function outputList(type, size, descriptions) {
  console.log('Your current build type is ' + type.yellow);
  console.log('Your current library size is ' + ((Math.round((size/1024) * 10) / 10) + '').yellow + ' kb\n');
  console.log('Active packages:')
  for (var i = 0, l = descriptions.length; i < l; i++) {
    var pre = (i == (l - 1)) ? '└' : '├';
    console.log(pre + '── ' + descriptions[i]);
  }
  console.log(' ')
}

function special(arr) {
  var result = [];
  for (var i = 0, l = arr.length; i <l; i++) {
    if (arr[i] == 'jeesh') {
      result = result.concat(jeesh);
    } else {
      result.push(arr[i]);
    }
  }
  result.unshift('ender-js');
  return result;
}

function activeFileSize(callback) {
  path.exists('./ender.min.js', function (exists) {
    if (!exists) {
      path.exists('./ender.js', function (exists) {
        if (!exists) return console.log('ender library doesn\'t exist');
        fs.readFile('ender.js', 'utf-8', function (err, data) {
          if (err) throw err;
          callback(data.length);
        });
      });
    } else {
      fs.readFile('ender.min.js', 'utf-8', function (err, data) {
        if (err) throw err;
        callback(data.length);
      });
    }
  });
}

function getHistory(callback) {
  path.exists('./ender.js', function (exists) {
    if (!exists) {
      path.exists('./ender.min.js', function (exists) {
        if (!exists) return console.log('ender library doesn\'t exist');
        fs.readFile('ender.min.js', 'utf-8', function (err, data) {
          if (err) throw err;
          callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
        });
      });
    } else {
      fs.readFile('ender.js', 'utf-8', function (err, data) {
        if (err) throw err;
        callback(data.match(/\*\sBuild:\s([^\n]*)/)[1]);
      });
    }
  });
}

/* UTILITY METHODS */
function unique(arr) {
  var hash = {}, result = [];
  for (var i = 0, l = arr.length; i <l; i++) {
    if (!hash[arr[i]]) {
      hash[arr[i]] = true;
      result.push(arr[i]);
    }
  }
  return result;
}
function reject(a, b) {
  return a.filter(function (item) {
    if (b.indexOf(item) != -1) return false;
    return true;
  });
}
function containsAll(a, b) {
  for(var i = b.length; i--;) {
    if (a.indexOf(b[i]) == -1) return false
  }
  return true;
}

/* UGLIFY METHODS */
function uglify(source, out, passback, callback) {
  var tok = uglifyJS.parser.tokenizer(source)
    , c = tok()
    , min = copywrite(c.comments_before) || ''
    , ast = uglifyJS.parser.parse(source);

  ast = uglifyJS.uglify.ast_mangle(ast);
  ast = uglifyJS.uglify.ast_squeeze(ast);
  min += uglifyJS.uglify.gen_code(ast);
  out(min, passback, callback);
}

function copywrite(comments) { //hack to retain uglify comments
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


/* FILE METHODS */
function output(data, filename, callback) {
  filename = filename + '.js';
  fs.writeFile(filename, data, encoding='utf8', function (err) {
    if (err) throw err;
    console.log((filename + ' successfully built!').yellow);
    callback && callback();
  });
}

function assemble(packages, _isAsync, callback){
  console.log('assembling packages...');
  processPackages(packages, _isAsync, function (_sync, _async, _asyncBridges) {
    var result = _sync.join('\n');
    if (_isAsync) {
      result += '\n\n' +
        '$.require([' + _async.join(',') + '], "ender");\n' +
        '$.ready("ender", function () { \n' +
          _asyncBridges.join('\n\n') +
        '\n});';
    }
    callback(result);
  });

}

function processComment(source) { //adds build command to build files
  source = source.toString();
  var i = source.indexOf('* License MIT') + 13,
      start = source.substring(0, i),
      end = source.substring(i);
  return start + '\n  * Build: ender ' + ENDER.cmd + end;
}

function processPackages(packages, _isAsync, callback) {
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

      constructSource(isAsync, _async, name, packageJSON.main, function (result) {

        if (!isAsync) {
          source = result;
        } else {
          _async = result;
        }

        //CONSTRUCT BRIDGE
        constructBridge(name, packageJSON.ender, function (content) {
          if (name == 'ender-js') {
            source = processComment(source);
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
             callback(_sync, _async, _asyncBridges);
          }

        });

      });

    });

  });
}

function constructSource(isAsync, _async, name, filePaths, callback) {
  var result = [];
  if (!isAsync) {
    filePaths.forEach(function (p) {
      fs.readFile(path.join('node_modules', name, p), 'utf-8', function (err, data) {
        if (err) throw err;
        result.push(data);
        if (filePaths.length == result.length) {
          callback(result);
        }
      });
    });
  } else {
    callback(_async.concat(filePaths.map(function (p) {
      return '"' + path.join('node_modules', name, p) + '"';
    })));
  }
}

function constructBridge(name, bridge, callback) {
  if (name == 'ender-js' || !bridge) {
    return callback();
  }
  fs.readFile(path.join('node_modules', name, bridge), 'utf-8', function (err, data) {
    if (err) throw err;
    callback(data);
  });
}

/*COMMAND METHODS*/
function processCommand(cmd, callback) {
  var args = typeof cmd == 'string' ? cmd.split(' ').slice(1) : cmd.slice(2)
    , type = args.shift();
  callback(type.toLowerCase(), args.join(',').replace(/\s|\,(?=\,)/g,'').split(',').filter(function(x){return x !== '';}));
}

/*NPM METHODS*/

function npmDecription(package, callback) {
  exec('npm info ' + package, function (err, out, stderr) {
    if (err) throw err;
    eval('var info = ' + out);
    var name = (info.name + '@' + info.version).yellow,
        desc = info.description;
    callback(name + (desc ? ' - ' + desc : ''));
  });
}

function npmVersion(callback) {
  exec('npm --version', function (err, out, stderr) {
    if (err) throw err;
    console.log("Building using NPM version " + out.replace(/[^\.\d]/g, ''));
    callback(out);
  });
}

function createDir(dir, callback) {
  path.exists(dir, function(exists) {
    if (!exists) {
      fs.mkdir(dir, 0777, function (err) {
        if (err) throw err;
        callback();
      });
    } else {
      callback();
    }
  });
}

function npmInstall(packages, callback) {
  npmVersion(function (ver) {
    createDir('node_modules', function () {
      var install = parseFloat(ver.split('.')[0]) < 1 ? 'npm bundle install ' : 'npm install ';
      console.log('installing packages with command "' + install + packages.join(' ') + '"...');
      console.log('this can take a minute...'.yellow);
      exec(install + packages.join(' '), function () {
        console.log('finished installing local packages');
        callback.apply(this, arguments);
      });
    });
  });
}



/* COMMONJS */
module.exports.exec = function (cmd, name, callback) {
  ENDER.welcome();
  processCommand(cmd, function(type, args) {
    ENDER.cmd = [type, args.join(' ')].join(' ');
    ENDER[type](args, name, null, callback);
  });
};