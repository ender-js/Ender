/*NPM METHODS*/
var path = require('path')
  , fs = require('fs')
  , npm = require('npm')
  , NPM = {

      log: function (msg) {
        console.log(msg);
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
          , isTree = typeof packageDependencies == 'object'
          , prefix = treeStack.map(function (tree, i) {
              return (posStack[i] == (Object.keys(tree).length - 1)) ? '  ' : '| ';
            }).join('')
          , head = isLast ? '└' : '├'
          , mid = '─'
          , tail = isTree ? '┬' : '─';

        if (!packageName) {
          console.log(' '); //gives the tree some breathing whitespace seperation from next cmd line.
          return; //no package o_O ... time to exit...
        }

        NPM.desc(packageName, _packages, function (name, desc) {
          var msg, connector = head + mid + tail;
          if (packageDependencies == -1) {
            msg = (prefix + connector + ' ' + name + (desc ? ' - ' + desc : '')).grey;
          } else {
            msg = prefix + connector + ' ' + name.yellow + (desc ? ' - ' + desc : '');
          }
          if (isTree) {
            posStack.push(pos);
            treeStack.push(tree);
            dep++;
            pos = 0;
            tree = packageDependencies;
          } else if (!isLast) {
            pos++;
          } else if (treeStack.length) {
            do {
               pos = posStack.pop();
               tree = treeStack.pop();
            } while (treeStack.length && (Object.keys(tree).length - 1) == pos);
            pos++;
            dep--;
          } else {
            pos++;
          }
          NPM.log(msg);
          NPM.recurseOverDependencies(tree, _packages, pos, dep, posStack, treeStack);
        });
      }

    , desc: function (package, packages, callback) {
        if (/\//.test(package)) {
          return callback && callback(package, '');
        }
        var packagePath = path.join('node_modules', packages[0][packages[1].indexOf(package)].replace(/::/g, '/node_modules/'))
          , location = path.join(packagePath, 'package.json');

        path.exists(location, function(exists) {
          if (exists) {
            fs.readFile(location, 'utf-8', function (err, data) {
              if (err) return console.log('something went wrong trying to read file at ' + location);
              var packageJSON = JSON.parse(data)
                , name = packageJSON.name + '@' + packageJSON.version
                , desc = packageJSON.description;
              callback && callback(name, desc);
            });
          } else {
            callback && callback('UNMET DEPENDENCY! '.red + package, 'Please install with ' + ('$ ender add ' + package).yellow);
          }
        });
      }

    , install: function (orgPackages, callback) {
        createDir('node_modules', function () {
          NPM.getNPMPackages(orgPackages, function (packages) {
            if (!packages.length) return callback && callback(null, packages);
            NPM.log('installing packages: "' + packages.join(' ') + '"...');
            NPM.log('this can take a minute...'.yellow);
            npm.load({ logfd: null, outfd: null }, function (err) {
              if (err) return console.log('something went wrong trying to load npm!'.red);
              npm.commands.install(packages, function (err, data) {
                if (err) return console.log('something went wrong installing your packages!'.red);
                NPM.log('successfully finished installing packages');
                callback && callback.apply(this, arguments);
              });
            });
          });
        });
      }

    , uninstall: function (packages, callback) {
        NPM.log('uninstalling ' + packages.join(' ').yellow);
        npm.load({ logfd: null, outfd: null }, function (err) {
          if (err) return console.log('something went wrong trying to load npm!');
          npm.commands.uninstall(packages, function (err) {
            if (err) return console.log('something went wrong uninstalling your packages!'.red);
            callback && callback();
          });
        });
      }

    , search: function (keywords, callback) {
        console.log('searching NPM registry...'.grey);
        npm.load({ logfd: null, outfd: null }, function (err) {
          if (err) return console.log('something went wrong trying to load npm!');
          npm.commands.search(keywords, function (err, result) {
            if (err) return console.log('something went wrong searching npm!'.red);
            callback && callback(result);
          });
        });
      }

    , isNPMPackage: function (name, callback) {
        if (/\//.test(name)) {
          if (!RegExp('\\\.js$').test(name)) {
            path.exists(path.join(name, 'package.json'), function (exists) {
              if (exists) {
                callback(true);
              } else {
                callback(false);
              }
            });
          } else {
            callback(false);
          }
        } else {
          callback(true);
        }
      }

    , getNPMPackages: function (packages, callback) {
        var npm = [], commonjs = [];
        if (!packages.length) return callback && callback(npm, commonjs);
        (function verify(i){
          var pkg = packages[i];
          if (i == packages.length) return callback(npm, commonjs);
          NPM.isNPMPackage(pkg, function (isPackage) {
            (isPackage ? npm : commonjs).push(pkg);
            verify(++i);
          });
        })(0);
      }

  };

function createDir(dir, callback) {
  path.exists(dir, function(exists) {
    if (!exists) {
      fs.mkdir(dir, 0777, function (err) {
        if (err) return console.log("somethign went wrong trying to create your dir :(");
        callback();
      });
    } else {
      callback();
    }
  });
}

module.exports = NPM;