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
  , argsParser = require('../../lib/args-parser')

buster.testCase('extend', {
    'test no specials': function () {
      var originalArgs = {
              command: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum' ]
          }
        , newArgs = {
              command: 'add'
            , packages: [ 'baz', 'bing' ]
          }
        , expectedArgs = {
              command: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum', 'baz', 'bing' ]
          }

      assert.equals(argsParser.extend(originalArgs, newArgs), expectedArgs)
    }

  , 'test with specials': function () {
      var originalArgs = {
              command: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum' ]
            , sandbox: [ 'foo' ]
            , use: 'yeehaw'
            , silent: true
            , help: true
          }
        , newArgs = {
              command: 'add'
            , packages: [ 'baz', 'bing' ]
            , sandbox: [ 'bar', 'baz' ]
            , silent: true
          }
        , expectedArgs = {
              command: 'build'
            , packages: [ 'fee', 'fie', 'foe', 'fum', 'baz', 'bing' ]
            , sandbox: [ 'foo', 'bar', 'baz' ]
            , use: 'yeehaw'
            , silent: true
            , help: true
          }

      assert.equals(argsParser.extend(originalArgs, newArgs), expectedArgs)
    }
})