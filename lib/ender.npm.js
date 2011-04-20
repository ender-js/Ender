/*NPM METHODS*/
var path = require('path')
  , fs = require('fs')
  , exec = require('child_process').exec
  , NPM = {

      desc: function (package, callback) {
        exec('npm info ' + package, function (err, out, stderr) {
          if (err) throw err;
          var info;
          eval('info = ' + out);
          var name = (info.name + '@' + info.version).yellow,
              desc = info.description;
          callback && callback(name + (desc ? ' - ' + desc : ''));
        });
      }

    , ver: function (callback) {
        exec('npm --version', function (err, out, stderr) {
          if (err) throw err;
          console.log("Building using NPM version " + out.replace(/[^\.\d]/g, ''));
          callback && callback(out);
        });
      }

    , install: function (packages, callback) {
        NPM.ver(function (ver) {
          createDir('node_modules', function () {
            var install = parseFloat(ver.split('.')[0]) < 1 ? 'npm bundle install ' : 'npm install ';
            console.log('installing packages with command "' + install + packages.join(' ') + '"...');
            console.log('this can take a minute...'.yellow);
            exec(install + packages.join(' '), function () {
              console.log('finished installing local packages');
              callback && callback.apply(this, arguments);
            });
          });
        });
      }

    , uninstall: function (packages, callback) {
        console.log('uninstalling ' + packages.join(' ').yellow);
        exec('npm uninstall ' + packages.join(' '), function (err) {
          if (err) throw err;
          callback && callback();
        });
      }
  };

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

module.exports = NPM;