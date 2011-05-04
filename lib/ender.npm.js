/*NPM METHODS*/
var path = require('path')
  , fs = require('fs')
  , FILE = require('./ender.file')
  , exec = require('child_process').exec
  , NPM = {

      log: function (msg) {
        console.log(msg);
      }

    , prettyPrintDependencies: function (tree, callback) {
        var paths = FILE.flattenDependencyTree(tree, null, function () {
          NPM.recurseOverDependencies(tree, arguments);
        });
      }

    , recurseOverDependencies: function (tree, _packages, pos, dep, posStack, treeStack) {
        //set defaults
        pos = pos || 0;
        dep = dep || 0;
        posStack = posStack || [];
        treeStack = treeStack || [];

        var keys = Object.keys(tree)
          , packageName = keys[pos]
          , packageDependencies = tree[packageName]
          , isLast = (keys.length - 1) == pos
          , prefix = treeStack.map(function (tree, i) {
              return (posStack[i] == (Object.keys(tree).length - 1)) ? '  ' : '| ';
            }).join('')
          , head = isLast ? '└' : '├'
          , mid = '─'
          , tail = !packageDependencies ? '─' : '┬';

        if (!packageName) {
          console.log(' '); //gives the tree some breathing whitespace seperation from next cmd line.
          return; //no package o_O ... time to exit...
        }

        NPM.desc(packageName, _packages, function (desc) {
          NPM.log(prefix + head + mid + tail + ' ' + desc);
          if (packageDependencies) {
            posStack.push(pos);
            treeStack.push(tree);
            dep++;
            pos = 0;
            tree = packageDependencies;
          } else if (!isLast) {
            pos++;
          } else if (treeStack.length) {
            var fat = 1
            do {
               pos = posStack.pop();
               tree = treeStack.pop();
            } while (treeStack.length && (Object.keys(tree).length - 1) == pos);
            pos++;
            dep--;
          }
          NPM.recurseOverDependencies(tree, _packages, pos, dep, posStack, treeStack);
        });
      }

    , desc: function (package, packages, callback) {
        var packagePath = path.join('node_modules', packages[0][packages[1].indexOf(package)].replace(/\//g, '/node_modules/'))
          , location = path.join(packagePath, 'package.json');
        fs.readFile(location, 'utf-8', function (err, data) {
          var packageJSON = JSON.parse(data)
            , name = (packageJSON.name + '@' + packageJSON.version).yellow
            , desc = packageJSON.description;
          callback && callback(name + (desc ? ' - ' + desc : ''));
        });
      }

    , ver: function (callback) {
        exec('npm --version', function (err, out, stderr) {
          if (err) throw err;
          NPM.log("Building using NPM version " + out.replace(/[^\.\d]/g, ''));
          callback && callback(out);
        });
      }

    , install: function (packages, callback) {
        NPM.ver(function (ver) {
          createDir('node_modules', function () {
            var install = parseFloat(ver.split('.')[0]) < 1 ? 'npm bundle install ' : 'npm install ';
            NPM.log('installing packages with command "' + install + packages.join(' ') + '"...');
            NPM.log('this can take a minute...'.yellow);
            exec(install + packages.join(' '), function () {
              NPM.log('finished installing local packages');
              callback && callback.apply(this, arguments);
            });
          });
        });
      }

    , uninstall: function (packages, callback) {
        NPM.log('uninstalling ' + packages.join(' ').yellow);
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