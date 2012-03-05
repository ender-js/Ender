var fs = require('fs')
  , path = require('path')
  , ejs = require('ejs')

    // cached for the duration of the app
  , templates = {}

  , render = function (templateString, data, callback) {
      var result = ejs.render(templateString, data)
      callback(null, result)
      //callback(null, template(templateString, data))
    }

    // TODO: this may be called for the same key multiple times before fs.readFile() returns
    // so it may be best to collect callbacks if a readFile is in progress and call them in
    // batch when it returns, to save duplicate reads

  , generateSource = function (key, file, data, callback) {
      if (!templates['ejs'+key]) { // is cached?
        fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
          if (err)
            return callback(err)

          templateContents = templateContents
            .replace(/^[\t ]+<%/gm, '<%')
            .replace(/\s*\\\n/g, '')
            .replace(/(^<%[^%]+%>)\n/gm, '$1')
          render(templates['ejs'+key] = templateContents, data, callback)
        })
      } else
        render(templates['ejs'+key], data, callback)
    }

module.exports.generateSource = generateSource
