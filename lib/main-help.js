/******************************************************************************
 * 'Help' executable module, what you get when you type `ender help [<cmd>]`.
 * The help documentation is stored in plain-text templates in the resources
 * directory and are passed through colors-tmpl to turn {red}red{/red} into
 * the same thing you'd get if you did 'red'.red with colors.js.
 * The default help file is 'main', you get this if you don't provide a 'cmd'
 * argument.
 */
var fs = require('fs')
  , path = require('path')
  , colorsTmpl = require('colors-tmpl')

  , templateDirectory = '../resources/help/'
  , aliases = {
        'rm': 'remove'
      , 'ls': 'info'
      , 'list': 'info'
    }

  , exec = function (args, out, callback) {
      var page = args.packages[0] || 'main'
        , file

      page = page.toLowerCase().replace(/[^a-z]/g,'')
      page = aliases[page] || page
      file = path.join(__dirname, templateDirectory, page + '.tmpl')

      try {
        // sync is ok here because we're unlikely to be called via the API
        if (path.existsSync(file))
          out.showDocument(colorsTmpl.render(fs.readFileSync(file, 'utf-8')))
        else
          out.noSuchCommand(args.packages[0])
      } catch (e) {
        return callback(e)
      }
      callback()
    }
 
module.exports.exec = exec