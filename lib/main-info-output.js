var archy = require('archy')
  , colors = require('colors')
  , extend = require('./util').extend
  , Output = require('./output')
  , argsParse = require('./args-parse')

  , toKb = function (size) {
      size = Math.round(size / 1024 * 10) / 10
      return size + ' kB'
    }

  , InfoOutput = extend(Output, { // inherit from Output

        buildInfo: function (filename, options, packages, sizes, archyTree) {
          var prepareTree = function (tree) {
            tree.nodes.forEach(prepareTree)
            if (tree.version) {
              tree.label =
                  (tree.label + '@' + tree.version)[tree.first ? 'yellow' : 'grey']
                + ' - '[tree.first ? 'white' : 'grey']
                + tree.description[tree.first ? 'white' : 'grey']
            }
          }
          prepareTree(archyTree)

          //this.log('Your current build type is ' + ('"' + options.main + '"').yellow)
          this.log('Your current build command is: ' + ('ender ' + argsParse.toContextString(options)).yellow)
          this.log(
              'Your current build size is: '
            + toKb(sizes.raw).yellow + ' raw, '
            + toKb(sizes.minify).yellow + ' minified and '
            + toKb(sizes.gzip).yellow + ' gzipped'
          )
          this.log()
          this.log(archy(archyTree))
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = InfoOutput