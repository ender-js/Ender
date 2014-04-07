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


var buster           = require('bustermove')
  , assert           = require('referee').assert
  , refute           = require('referee').refute
  , ender            = require('../../src/main')
  , fs               = require('fs')
  , path             = require('path')
  , util             = require('util')

buster.testCase('Functional: version', {
    'exec version': function (complete) {
      var outArg = {
              log: function (str) { outArg.actual += str + '\n'; }
            , actual: ''
          }

      fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf-8', function (err, contents) {
        refute(err, 'read package.json')

        outArg.expected = 'Active version: v' + contents.match(/"version"\s*:\s*"([^"]+)"/)[1] + '\n'

        ender.exec('ender version', outArg, function () {
          assert.equals(outArg.actual, outArg.expected, 'printed correct version string')
          complete()
        }.bind(this))
      }.bind(this))
    }
})
