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

//FIXME: remove this after 0.8 available on travis
!('exists' in require('fs')) && (function () {
  require('fs').exists     = require('path').exists
  require('fs').existsSync = require('path').existsSync
}())

var referee = require('referee')

referee.add('isString', {
    assert: function (actual) {
      return typeof actual == 'string'
    }
  , assertMessage: 'expected ${0} to be a string'
})
referee.add('isArray', {
    assert: function (actual) {
      return Array.isArray(actual)
    }
  , assertMessage: 'expected ${0} to be an Array'
})
referee.add('fail', {
    assert: function () {
      return false
    }
  , assertMessage: '${0}'
})
referee.add('contains', {
    assert: function (actual, expected) {
      return Array.prototype.indexOf.call(actual, expected) != -1
    }
  , assertMessage: 'expected ${0} to contain ${1}'
  , refuteMessage: 'expected ${0} to not contain ${1}'
})
