var defaultRootPackage = 'ender-js'
  , stripVersionRegex = /@.*$/

  , uniquePackages = function (packages) {
      var ret = []
        , have = []

      packages.forEach(function (p) {
        var name = p.replace(stripVersionRegex, '')
        if (have.indexOf(name) == -1) {
          ret.push(p)
          have.push(name)
        }
      })

      return ret
    }

  , packageList = function (args) {
      var packages = args.remaining || [ '.' ]
      packages = [ defaultRootPackage ].concat(packages)
      return uniquePackages(packages)
    }

module.exports = {
    packageList: packageList
  , uniquePackages: uniquePackages
}
