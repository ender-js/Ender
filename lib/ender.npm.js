/*NPM METHODS*/
var path = require('path')
  , fs = require('fs')
  , exec = require('child_process').exec
  , NPM = {

      log: function (msg) {
        console.log(msg);
      }

    , prettyPrintDependencies: function (tree, pos, dep, posStack, treeStack) {
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

        if (!packageName) return; //no package o_O ... time to exit...

        NPM.desc(packageName, function (desc) {
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
            } while (treeStack.length >= 1 && (Object.keys(tree).length - 1) == pos);
            pos++;
            dep--;
          } else {
            //callback could go here eventually...
            return;
          }
          NPM.prettyPrintDependencies(tree, pos, dep, posStack, treeStack);
        });
      }

    , desc: function (package, callback) {
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