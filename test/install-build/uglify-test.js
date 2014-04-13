/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var buster = require('bustermove')
  , assert = require('referee').assert
  , refute = require('referee').refute

  , uglify = require('../../lib/minifiers/uglify')


buster.testCase('Uglify', {
    'test basic minification': function (done) {
      var original = 'function foobar () { var biglongvar = \'str\'; return biglongvar + \'str\'; }\n\n'
        , expected = /^function foobar\(\)\{var ([a-z])="str";return \1\+"str"\}$/

      uglify({ build: original }, {}, {}, function (err, results) {
        refute(err)
        assert.match(results.minifiedBuild, expected)
        done()
      })
    }

  , 'test minification syntax error': function (done) {
      uglify({ build: 'this is not javascript!' }, {}, {}, function (err, results) {
        refute(results)
        assert(err)
        assert(err instanceof Error)
        assert(err.cause)
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
              /^\/\*!\n \* this is a copyright block\n \*\/\n;?!function\(\)\{var ([a-z])="str";return \1\+"str"\}\(\),\n?\/\*!\n \* this is another copyright block\n \*\/\n!function\(\)\{var ([a-z])="str";return \2\+"str"\}\(\);?$/

      uglify({ build: original }, {}, {}, function (err, results) {
        refute(err)
        assert.match(results.minifiedBuild, expected)
        done()
      })
    }
})
