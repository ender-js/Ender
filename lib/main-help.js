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