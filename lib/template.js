var fs = require('fs')
  , path = require('path')
  , ejs = require('ejs')

    // cached for the duration of the app
  , templates = {}
  , readCallbacks = {}

  , render = function (templateString, data, callbacks) {
      var result = ejs.render(templateString, data)
      callbacks.forEach(function (cb) {
        cb(null, result)
      })
    }

  , generateSource = function (key, file, data, callback) {
      if (!templates[key]) { // is cached?
        if (readCallbacks[key]) {
          readCallbacks[key].push(callback)
        } else {
          readCallbacks[key] = [ callback ]
          fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
            if (err)
              return callback(err)

            templates[key] = templateContents
              .replace(/^[\t ]+<%/gm, '<%')
              .replace(/\s*\\\n/g, '')
              .replace(/(^<%[^%]+%>)\n/gm, '$1')
            render(templates[key], data, readCallbacks[key])
            ;delete readCallbacks[key]
          })
        }
      } else
        render(templates[key], data, [ callback ])
    }

module.exports.generateSource = generateSource
