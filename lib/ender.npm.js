/*NPM METHODS*/
var path = require('path')
  , fs = require('fs')
  , npm = require('npm')
  , async = require('async')
  , ENDER = { file: require('./ender.file') }

ENDER.npm = module.exports = {

    prettyPrintDependencies: function (packages, callback) {
      console.log('Active packages:')

      ENDER.file.constructDependencyTree(packages, 'node_modules', function (err, tree) {
        ENDER.file.flattenDependencyTree(tree, null, function (err, flattenedPackages, uniquePackages) {
          ENDER.npm.recurseOverDependencies(tree, [flattenedPackages, uniquePackages])
        })
      })
    }

  , stripVersions: function (packages) {
      return packages.map(function (package) { return package.replace(/@.*/, '') })
    }

  , recurseOverDependencies: function (tree, packageTypes, pos, dep, posStack, treeStack) {
      var keys = Object.keys(tree)
        , mid = '─'
        , packageName
        , packageDependencies
        , isLast
        , isTree
        , prefix
        , head
        , tail

      pos = pos || 0
      dep = dep || 0
      posStack = posStack || []
      treeStack = treeStack || []
      packageName = keys[pos]
      packageDependencies = tree[packageName]
      isLast = (keys.length - 1) == pos
      isTree = typeof packageDependencies == 'object'
      prefix = treeStack.map(function (tree, i) {
        return (posStack[i] == (Object.keys(tree).length - 1)) ? '  ' : '| '
      }).join('')
      head = isLast ? '└' : '├'
      tail = isTree ? '┬' : '─'

      if (!packageName) {
        // this is here for breathing room
        return console.log(' ');
      }

      ENDER.npm.desc(packageName, packageTypes, function (name, desc) {
        var connector = head + mid + tail
          , msg

        if (!~packageDependencies) {
          msg = (prefix + connector + ' ' + name + (desc ? ' - ' + desc : '')).grey
        } else {
          msg = prefix + connector + ' ' + name.yellow + (desc ? ' - ' + desc : '')
        }

        if (isTree) {
          posStack.push(pos)
          treeStack.push(tree)
          dep++
          pos = 0
          tree = packageDependencies
        } else if (!isLast) {
          pos++
        } else if (treeStack.length) {
          do {
             pos = posStack.pop()
             tree = treeStack.pop()
          } while (treeStack.length && (Object.keys(tree).length - 1) == pos)
          pos++
          dep--
        } else {
          pos++
        }
        console.log(msg);
        ENDER.npm.recurseOverDependencies(tree, packageTypes, pos, dep, posStack, treeStack);
      });
    }

  , desc: function (package, packageTypes, callback) {
      var packagePath = path.join('node_modules', packageTypes[0][packageTypes[1].indexOf(package)].replace(/\//g, '/node_modules/'))
        , location = path.join(packagePath, 'package.json')

      path.exists(location, function(exists) {
        if (exists) {
          fs.readFile(location, 'utf-8', function (err, data) {
            if (err) return console.log('something went wrong trying to read file at ' + location)
            var packageJSON = JSON.parse(data)
              , name = packageJSON.name + '@' + packageJSON.version
              , desc = packageJSON.description
            callback && callback(name, desc)
          });
        } else {
          callback && callback('UNMET DEPENDENCY! '.red + package, 'Please install with ' + ('$ ender add ' + package).yellow)
        }
      });
    }

  , install: function (packages, options, callback) {
      ENDER.file.createDir('node_modules', function (err) {
        if (err) {
          if (options.debug) throw err
          return callback(err)
        }
        console.log('installing packages: "' + packages.join(' ') + '"...')
        console.log('this can take a minute...'.yellow)
        npm.load({ logfd: 2, outfd: 1 }, function (err) {
          if (err) {
            if (options.debug) throw err
            return console.log('something went wrong trying to load npm!'.red)
          }
          npm.commands.install(packages, function (err, data) {
            if (err) {
              if (options.debug) throw err
              return console.log('something went wrong installing your packages!'.red)
            }

            var localInstall = packages.some(function (item) {
              // this is a hack because of REEEIDD! DAMN YOU REEIIDD!
              // https://github.com/isaacs/npm/commit/8b7bf5ab0c214b739b5fd6af07003cac9e5fc712
              return path.resolve(item) == npm.prefix
            })

            if (localInstall) {
              npm.commands.install([], complete)
            } else {
              complete.apply(this, arguments)
            }

            function complete (err, data) {
              if (err) {
                if (options.debug) throw err
                console.log('invalid package specified... please check your spelling and try again.'.red)
                return callback && callback(err)
              }
              console.log('successfully finished installing packages')
              callback && callback()
            }
          })
        })
      })
    }

  , uninstall: function (packages, callback) {
      console.log('uninstalling ' + packages.join(' ').yellow)
      npm.load({ logfd: 2, outfd: 1 }, function (err) {
        if (err) {
          callback(err)
          return console.log('something went wrong trying to load npm!')
        }
        npm.commands.uninstall(packages, function (err) {
          if (err) {
            callback(err)
            return console.log('something went wrong uninstalling your packages!'.red)
          }
          callback()
        })
      })
    }

  , search: function (keywords, callback) {
      console.log('searching NPM registry...'.grey)

      npm.load({ logfd: 2, outfd: 1 }, function (err) {
        if (err) {
          callback(err)
          return console.log('something went wrong trying to load npm!')
        }
        npm.commands.search(keywords, function (err, result) {
          if (err) {
            callback(err)
            return console.log('something went wrong searching npm!'.red)
          }
          callback(result)
        });
      });
    }

}
