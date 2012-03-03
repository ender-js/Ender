var fs = require('fs')
  , path = require('path')
  , handlebars = require('handlebars')

    // cached for the duration of the app
  , templates = {}

    // TODO: this may be called for the same key multiple times before fs.readFile() returns
    // so it may be best to collect callbacks if a readFile is in progress and call them in
    // batch when it returns, to save duplicate reads
  , generateSource = function (key, file, data, callback) {
      if (!templates[key]) { // is cached?
        fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
          if (err)
            return callback(err)

          // allow our templates to be human-readable but not leave unnecessary
          // whitespace when being used
          templateContents = templateContents
            .replace(/^\s*\{\{/gm, '{{')
            .replace(/\s*\\\n/g, '')
          templates[key] = handlebars.compile(templateContents)
          callback(null, templates[key](data))
        })
      } else
        callback(null, templates[key](data))
    }

module.exports.generateSource = generateSource
