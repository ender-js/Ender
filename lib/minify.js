var uglifyParser = require('uglify-js').parser
  , uglifyMangler = require('uglify-js').uglify
    , gzip = require('gzip')

var minify = function (source, callback) {
  try {
    var minified =
      uglifyMangler.gen_code(
        uglifyMangler.ast_squeeze(
          uglifyMangler.ast_mangle(
            uglifyParser.parse(source))))
    callback(null, minified)
  } catch (ex) {
    callback(ex)
  }
}

module.exports.minify = minify
