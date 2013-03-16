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


var buster     = require('bustermove')
  , assert     = require('referee').assert
  , refute     = require('referee').refute
  , searchUtil = require('../../lib/main-search-util')

buster.testCase('Search util', {
    'test sortByRegExp': function () {
      var regex = /a|D|6|I$/ // match 0, 1 & 3 ('6' is ignored because it's not in priority list
        , array = [
              { p1: 'abc', p2: '123', p3: 'ABC' }
            , { p1: 'cde', p2: '345', p3: 'CDE' }
            , { p1: 'efg', p2: '567', p3: 'EFG' }
            , { p1: 'ghi', p2: '789', p3: 'GHI' }
          ]
        , arrayCopy = [ array[0], array[1], array[2], array[3] ]
        , ranked = []
        , priority = [ 'p3', 'p1' ] // means we should get, in order: 1, 3, 0

      searchUtil.sortByRegExp(regex, arrayCopy, ranked, priority)

      assert.equals(ranked.length, 3)
      assert.same(ranked[0], array[1])
      assert.same(ranked[1], array[3])
      assert.same(ranked[2], array[0])

      assert.equals(arrayCopy.length, 1)
      assert.same(arrayCopy[0], array[2])
    }
})
