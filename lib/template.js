var fs = require('fs')
  , path = require('path')
  , ejs = require('ejs')

    // cached for the duration of the app
  , templates = {}
  , readCallbacks = {}

  , render = function (templateString, callbackData) {
      callbackData.forEach(function (cbd) {
        cbd.callback(null, ejs.render(templateString, cbd.data))
      })
    }

  , generateSource = function (key, file, data, callback) {
      var cbd = { callback: callback, data: data }
      if (!templates[key]) { // is cached?
        if (readCallbacks[key]) {
          readCallbacks[key].push(cbd)
        } else {
          readCallbacks[key] = [ cbd ]
          fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
            if (err)
              return callback(err)

            templates[key] = templateContents
              .replace(/^[\t ]+<%/gm, '<%')
              .replace(/\s*\\\n/g, '')
              .replace(/(^<%[^%]+%>)\n/gm, '$1')
            render(templates[key], readCallbacks[key])
            ;delete readCallbacks[key]
          })
        }
      } else
        render(templates[key], [ cbd ])
    }

module.exports.generateSource = generateSource