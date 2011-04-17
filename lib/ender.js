var fs = require('fs')
  , path = require('path')
  , rimraf = require('rimraf')
  , exec = require('child_process').exec
  , uglifyJS = require('uglify-js');
    require('colors');

var commonJSBridge = {
    head: '!function () { var module = { exports: {} }; '
  , foot: ' $.ender(module.exports); }();'
};

/*
 * ENDER PUBLIC API -----------------------------------
 */

var ENDER = {

    welcome: function () {
      console.log("ENDER - The no-library library".red);
    },

    '-b': function () {
      ENDER.build.apply(this, arguments);
    },

    '-a': function () {
      ENDER.async.apply(this, arguments);
    },

    '-j': function () {
      ENDER.just.apply(this, arguments);
    },

    '-h': function () {
      ENDER.help.apply(this, arguments);
    },

    async: function (packages, noop, callback) {
      packages.unshift('scriptjs');
      ENDER.build.call(this, packages, true, callback);
    },

    just: function (packages, noop, callback) {
      ENDER.build.call(this, packages, false, function () {
        rimraf('node_modules', function (err) {
          if (err) throw err;
          console.log('node_modules directly successfully cleaned up.'.green);
          callback && callback();
        });
      });
    },

    build: function (packages, isAsync, callback) {
      if (!packages.length) {
        return console.log('error: ender build requires packages.'.yellow);
      }
      packages = unique(packages);
      packages.unshift('ender');
      npmInstall(packages, function (err, out, stderr) {
        if (err) throw err;
        assemble(packages, isAsync, function (source) {
          output(source, 'ender');
          uglify(source, output, 'ender.min');
          callback && callback();
        });
      });
    },

    help: function () {
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

/* UGLIFY METHODS */
function uglify(source, callback, passback) {
  var tok = uglifyJS.parser.tokenizer(source)
    , c = tok()
    , min = copywrite(c.comments_before) || ''
    , ast = uglifyJS.parser.parse(source);

  ast = uglifyJS.uglify.ast_mangle(ast);
  ast = uglifyJS.uglify.ast_squeeze(ast);
  min += uglifyJS.uglify.gen_code(ast);
  callback(min, passback);
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
function output(data, filename) {
  filename = filename + '.js';
  fs.writeFileSync(filename, data, encoding='utf8');
  console.log((filename + ' successfully built!').yellow);
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

function processPackages(packages, _isAsync, callback) {
  var _sync = [], _async = [], _asyncBridges = [], i = 0;
  packages.forEach(function (name) {
    var location = path.join('node_modules', name, 'package.json');
    fs.readFile(location, 'utf-8', function (err, data) {
      if (err) throw err;

      var packageJSON = JSON.parse(data)
      , isAsync = /ender|scriptjs/.test(name) || !packageJSON.ender ? false : _isAsync
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
          if (name != 'ender') {
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

function constructBridge (name, bridge, callback) {
  if (name == 'ender' || !bridge) {
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
function npmVersion(callback) {
  exec('npm --version', function (err, out, stderr) {
    if (err) throw err;
    console.log("Building using NPM version " + out.replace(/[^\.\d]/g, ''));
    callback(out);
  });
}

function npmInstall(packages, callback) {
  npmVersion(function (ver) {
    var install = parseFloat(ver.split('.')[0]) < 1 ? 'npm bundle install ' : 'npm install ';
    console.log('installing packages with command "' + install + packages.join(' ') + '"...');
    console.log('this can take a minute...'.yellow);
    exec(install + packages.join(' '), function () {
      console.log('finished installing local packages');
      callback.apply(this, arguments);
    });
  });
}




/* COMMONJS */
module.exports.exec = function (cmd, callback) {
  ENDER.welcome();
  processCommand(cmd, function(type, args) {
    ENDER[type](args, null, callback);
  });
};