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
  , Output = require('../../lib/output/output')
  , errors = require('../../lib/errors')

buster.testCase('Output (base)', {
    setUp: function () {
      // emulate `require('util')`
      this.out = {
          buf: ''
        , print: function(s) {
            this.buf += s
          }
      }
      this.output = Output.create()
    }

  , 'test log(str)': function () {
      this.output.init(this.out)
      this.output.log('a string')
      assert.equals(this.out.buf, 'a string\n')
    }

  , 'test debug(str) with debug=false': function () {
      this.output.init(this.out)
      this.output.debug('a string')
      assert.equals(this.out.buf, '')
    }

  , 'test debug(str) with debug=true': function () {
      this.output.init(this.out, true)
      this.output.debug('a string')
      assert.equals(this.out.buf, 'DEBUG: a string\n')
    }

  , 'test error() with debug=false': function () {
      this.output.init(this.out, false)
      this.output.error(new errors.EnderError('an error'))
      assert.match(this.out.buf, /.*Error:.*an error.*/)
    }

  , 'test heading() short': function () {
      this.output.init(this.out)
      this.output.heading('This is a heading')
      assert.match(this.out.buf, /This is a heading[^\n]*\n-----------------/)
    }

  , 'test heading() long': function () {
      this.output.init(this.out)
      this.output.heading('H1')
      assert.match(this.out.buf, /H1[^\n]*\n--/)
    }

  , 'test heading() with meta': function () {
      this.output.init(this.out)
      this.output.heading('H1', 'h2')
      assert.match(this.out.buf, /H1[^\n ]* \(h2\)[^\n]*\n--/)
    }

})