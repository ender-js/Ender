//adapted from node-jitsu's require-analyzer
//analyzes js files for require statements
//https://github.com/nodejitsu/require-analyzer

var spawn = require('child_process').spawn
  , path = require('path')
  , CMD = require('./ender.cmd')
  , NPM = require('./ender.npm');

var analyzer = module.exports = function (target, forceInstall, askInstall, callback) {
  var packageNames = []
    , packagePaths = []
    , merged = {}
    , errs = ['The following error was encountered while trying to parse ' + target.yellow]
    , deps = spawn('node', [path.join(__dirname, '..', 'bin', 'find-dependencies'), target]);

  function parseLines(data, prefix, fn) {
    data = data.toString();
    if (data !== '') {
      data.toString().split('\n').filter(function (line) {
        return line !== '';
      }).forEach(function (line) {
        if (line.indexOf(prefix) !== -1) {
          line = line.replace(prefix, '');
          fn(line);
        }
      });
    }
  }

  deps.stdout.on('data', function (data) {
    parseLines(data, '__!name::', function (dep) {
      packageNames.push(dep);
    });
    parseLines(data, '__!path::', function (dep) {
      packagePaths.push(dep);
    });
  });

  deps.stderr.on('data', function (data) {
    parseLines(data, '__!err::', function (line) {
      errs.push(line);
    });
  });

  var timeoutId = setTimeout(function () {
    deps.kill();
  }, 5000);

  deps.on('exit', function () {
    clearTimeout(timeoutId);
    if (!askInstall) {
      if (forceInstall) {
        return callback(null, packageNames, packagePaths);
      } else {
        return callback(null, [packageNames[0]], [packagePaths[0]]);
      }
    } else if (errs.length > 1) {
      var last = packageNames[packageNames.length - 1];
      if (last && !/^[.\/]/.test(last)) { //is NPM package...
        console.log(('Pausing dependency analysis on ' + target).yellow);
        console.log('The dependency ' + last.red + ' could not be found...');

        if (forceInstall) askCB('yes');
        else CMD.ask('Would you like ender to install it [yes|no]?'.cyan, /(yes|no)/, askCB);

        function askCB (data) {
          if (data === 'yes') {
            NPM.install([last], function () {
              analyzer(target, forceInstall, askInstall, callback);
            });
          } else {
            console.log('continuing without ' + target + '\'s dependencies...');
            callback(null, [packageNames[0]], [packagePaths[0]]);
          }
        }
      } else {
        askCallback(packageNames, packagePaths, target, callback);
      }
    } else if (forceInstall) {
      return callback(null, packageNames, packagePaths);
    } else {
      askCallback(packageNames, packagePaths, target, callback);
    }
  });
};

function askCallback (packageNames, packagePaths, target, callback) {

  if (packageNames.length > 1) {
    console.log(('The following dependencies were found for ' + target + ':').yellow)

    for (var head, i = 1, l = packageNames.length; i < l; i++) {
      head = i == (packageNames.length - 1) ? '└' : '├';
      console.log(' - ' + packageNames[i]);
    }

    CMD.ask(
      'Would you like ender to include these in your ender build [yes|no]?'.cyan, /(yes|no)/, function (data) {
        if (data === 'yes') {
          callback(null, packageNames, packagePaths, true);
        } else {
          callback(null, [packageNames[0]], [packagePaths[0]]);
        }
      }
    );
  } else {
    callback(null, packageNames, packagePaths);
  }

}