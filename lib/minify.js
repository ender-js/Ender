var uglifyParser = require('uglify-js').parser
  , uglifyMangler = require('uglify-js').uglify

  , minify = function (source, callback) {
      var comments = []
        , token = '"Ender: preserved comment block"'
        , reMultiComments = /\/\*![\s\S]*?\*\//g
          // we add a comma because uglify does too
        , reTokens = RegExp(token + ',?', 'g')

      source = source.replace(reMultiComments, function(comment) {
        comments.push(comment)
        return ';' + token + ';'
      })

      try {
        source =
          uglifyMangler.gen_code(
            uglifyMangler.ast_squeeze(
              uglifyMangler.ast_mangle(
                uglifyParser.parse(source))))

        source = source.replace(reTokens, function(s, i) {
          return (i ? '\n' : '') + comments.shift() + '\n'
        })

        callback(null, source)
      } catch (ex) {
        callback(ex)
      }
    }

module.exports.minify = minify
