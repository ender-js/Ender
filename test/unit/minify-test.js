var buster = require('buster')
  , assert = buster.assert
  , minify = require('../../lib/minify')

buster.testCase('Minify', {
    'test basic minification': function (done) {
      var original = 'function foobar () { var biglongvar = \'str\'; return biglongvar + \'str\'; }\n\n'
        , expected = 'function foobar(){var a="str";return a+"str"}'

      minify.minify(original, function (err, actual) {
        refute(err)
        assert.equals(actual, expected)
        done()
      })
    }

  , 'test minification syntax error': function (done) {
      minify.minify('this is not javascript!', function (err, output) {
        refute(output)
        assert(err)
        assert.isString(err.message)
        done()
      })
    }

  , 'test minifier ignores copyright comment blocks': function (done) {
      var original =
              '/*!\n'
            + ' * this is a copyright block\n'
            + ' */\n'
            + '!function foobar () { var biglongvar = \'str\'; return biglongvar + \'str\'; }();\n\n'
            + '/*!\n'
            + ' * this is another copyright block\n'
            + ' */\n\n'
            + '!function foobar2 () { var biglongvar = \'str\'; return biglongvar + \'str\'; }();'
         , expected =
              '/*!\n'
            + ' * this is a copyright block\n'
            + ' */\n'
            + '!function(){var b="str";return b+"str"}(),\n'
            + '/*!\n'
            + ' * this is another copyright block\n'
            + ' */\n'
            + '!function(){var b="str";return b+"str"}()'

      minify.minify(original, function (err, actual) {
        refute(err)
        assert.equals(actual, expected)
        done()
      })
    }
})
