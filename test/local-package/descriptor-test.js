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


var buster       = require('bustermove')
  , assert       = require('referee').assert
  , refute       = require('referee').refute
  , LocalPackage = require('../../lib/local-package')

buster.testCase('Extend Descriptor', {
      'setUp': function () {
        this.runTest = function (data, key, expected, same) {
          var packageDescriptor = LocalPackage.extendDescriptor(data)
          key = Array.isArray(key) ? key : [ key ]
          expected = Array.isArray(expected) ? expected : [ expected ]
          same = typeof same == 'undefined' ? [ false ] : Array.isArray(same) ? same : [ same ]
          key.forEach(function (k, i) {
            assert[same[i] ? 'same' : 'equals'](packageDescriptor[key[i]], expected[i])
          })
        }
      }

    , 'test missing "ender" property': function () {
        var packageDescriptor = LocalPackage.extendDescriptor({
            name: 'foobar!'
        })
        refute.defined(packageDescriptor.ender)
      }

    , 'test noop "ender" property': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: 'noop'
            }
          , 'ender'
          , null
        )
      }

    , 'test ender override "bridge" property': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: { bridge: 'yohoho' }
            }
          , 'bridge'
          , 'yohoho'
        )
      }

    , 'test "ender->name" property replaces non-existent root': function () {
        this.runTest(
            { ender: { name: 'yohoho' } }
          , 'name'
          , 'yohoho'
        )
      }

    , 'test "overlay->ender->name" property replaces non-existent root': function () {
        this.runTest(
            { overlay: { ender: { name: 'yohoho' } } }
          , 'name'
          , 'yohoho'
        )
      }

    , 'test standard name': function () {
        this.runTest(
            { name: 'foobar!' }
          , 'name'
          , 'foobar!'
        )
      }

    , 'test ender override name': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: { name: 'bam!' }
            }
          , 'name'
          , 'bam!'
        )
      }

    , 'test ender override name wtih "overlay->ender"': function () {
        this.runTest(
            {
                name: 'foobar!'
              , overlay: { ender: { name: 'bam!' } }
            }
          , 'name'
          , 'bam!'
        )
      }

    , 'test standard dependencies': function () {
        var expected = { foo: '*', bar: '*' }
        this.runTest(
            { dependencies: expected }
          , 'dependencies'
          , expected
          , true
        )
      }

    , 'test ender override dependencies': function () {
        var expected = { fat: '*', fatter: '*' }
        this.runTest(
            {
                dependencies: { foo: '*', bar: '*' }
              , ender: { dependencies: expected }
            }
          , 'dependencies'
          , expected
          , true
        )
      }

    , 'test ender override dependencies with "overlay->ender"': function () {
        var expected = { fat: '*', fatter: '*' }
        this.runTest(
            {
                dependencies: { foo: '*', bar: '*' }
              , overlay: { ender: { dependencies: expected } }
            }
          , 'dependencies'
          , expected
          , true
        )
      }

    , 'test standard main': function () {
        var expected = [ 'foobar!' ]
        this.runTest(
            { main: expected }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }

    , 'test ender override main': function () {
        var expected = [ 'iiii am a mannnnn of constant sorrowwwww' ]
        this.runTest(
            {
                main: [ 'wha?' ]
              , ender: { main: expected }
            }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }

    , 'test ender override main with "overlay->ender"': function () {
       var expected = [ 'iiii am a mannnnn of constant sorrowwwww' ]
        this.runTest(
            {
                main: [ 'wha?' ]
              , overlay: { ender: { main: expected } }
            }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }

    , 'test if no override property then no override': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: expectedMain
              , name: 'who?'
              , ender: { bogus: 'main and name properties not in here so should use root values' }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'who?' ]
          , [ true, false ]
        )
      }

    , 'test if no overlay override property then no override': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: expectedMain
              , name: 'who?'
              , overlay: {
                    ender: {
                        bogus: 'main and name properties not in here so should use root values'
                    }
                }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'who?' ]
          , [ true, false ]
        )
      }

    , 'test "ender" gets preference over "overlay->ender"': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: [ 'nah' ]
              , name: 'who?"'
              , ender: {
                    main: expectedMain
                  , name: 'mary had a little lamb'
                }
              , overlay: {
                    ender: {
                        main: [ 'bam!' ]
                      , name: 'nonono"'
                    }
                }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'mary had a little lamb' ]
          , [ true, false ]
        )
      }
})