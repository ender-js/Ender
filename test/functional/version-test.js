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
  , ender            = require('../../lib/main')
  , fs               = require('fs')
  , path             = require('path')
  , util             = require('util')

buster.testCase('Functional: version', {
    'setUp': function () {
      this.output = []
      this.stub(util, 'print', function (s) {
        this.output.push(s)
      }.bind(this))
    }

  , 'exec version (API)': function (complete) {
      fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf-8', function (err, contents) {
        refute(err, 'read package.json')

        var expectedVersion = contents.match(/"version"\s*:\s*"([^"]+)"/)[1]

        ender.exec('ender version', function () {
          var actualVersionString

          this.output.forEach(function (str) {
            if (/^Active /.test(str))
              actualVersionString = str.replace(/[^\w\:\s\.\-]/, '')
          }.bind(this))

          assert.equals(actualVersionString, 'Active version: v' + expectedVersion, 'printed correct version string')
          complete()
        }.bind(this))
      }.bind(this))
    }
})
