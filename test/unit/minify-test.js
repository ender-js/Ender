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


var buster      = require('buster')
  , assert      = buster.assert
  , minify      = require('../../lib/minify')
  , enderMinify = require('ender-minify')
  , MinifyError = require('../../lib/errors').MinifyError

buster.testCase('Minify', {
    'setUp': function () {
      this.mockEnderMinify = this.mock(enderMinify)
      this.sourceArg       = { source: 1 }
      this.resultArg       = { result: 1 }

      this.expectMinify    = function (minifier, expectedOptions) {
        this.mockEnderMinify
          .expects('minify')
          .once()
          .withArgs(minifier, this.sourceArg, expectedOptions)
          .callsArgWith(3, null, this.resultArg)
      }.bind(this)

      this.runTest         = function (parsedArgs, done) {
        minify.minify(parsedArgs, this.sourceArg, function (err, result) {
          refute(err)
          assert.same(result, this.resultArg)
          done()
        }.bind(this))
      }.bind(this)
    }

  , 'test basic minify, default to uglify': function (done) {
      var parsedArgs      = { foo: 'bar' } // shouldn't see this come through
        , expectedOptions = {}

      this.expectMinify('uglify', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure default options': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure' }
        , expectedOptions = {}

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure level option (whitespace)': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure', level: 'whitespace' }
        , expectedOptions = { level: 'whitespace' }

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure level option (simple)': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure', level: 'simple' }
        , expectedOptions = { level: 'simple' }

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure level option (advanced)': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure', level: 'advanced' }
        , expectedOptions = { level: 'advanced' }

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure externs option': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure', externs: [ 'bing', 'bang' ] }
        , expectedOptions = { externs: [ 'bing', 'bang' ] }

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }

  , 'test closure level and externs options': function (done) {
      var parsedArgs      = { foo: 'bar', minifier: 'closure', level: 'advanced', externs: [ 'woo', 'hoo' ] }
        , expectedOptions = { level: 'advanced', externs: [ 'woo', 'hoo' ] }

      this.expectMinify('closure', expectedOptions)
      this.runTest(parsedArgs, done)
    }
})