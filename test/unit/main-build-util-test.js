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


var buster      = require('bustermove')
  , assert      = require('referee').assert
  , refute      = require('referee').refute
  , buildUtil   = require('../../lib/main-build-util')

buster.testCase('Build util', {
    'packageList': {
        'setUp': function () {
          this.testPackageList = function (args, expected) {
            var packages = buildUtil.packageList(args)
            assert.equals(packages, expected)
          }
        }

      , 'test empty args': function () {
            // not really going to happen given the current args-parse
            this.testPackageList({ }, [ 'ender-core', 'ender-commonjs', '.' ])
          }

      , 'test no args': function () {
            this.testPackageList({ packages: [] }, [ 'ender-core', 'ender-commonjs', '.' ])
          }

      , 'test 1 package': function () {
          this.testPackageList({ packages: [ 'apkg' ] }, [ 'ender-core', 'ender-commonjs', 'apkg' ])
        }

      , 'test multiple packages': function () {
          this.testPackageList(
              { packages: [ 'apkg', 'pkg2', 'pkg3', '.', '..' ] }
            , [ 'ender-core', 'ender-commonjs', 'apkg', 'pkg2', 'pkg3', '.', '..' ]
          )
        }

      , 'test duplicate packages': function () {
          this.testPackageList(
              { packages: [ 'apkg', 'pkg2', 'apkg' ] }
            , [ 'ender-core', 'ender-commonjs', 'apkg', 'pkg2' ]
          )
        }
    }

  , 'uniquePackages': {
        'setUp': function () {
          this.testUniquePackages = function (packages, expected) {
            var uniques = buildUtil.uniquePackages(packages)
            assert.equals(uniques, expected)
          }
        }

      , 'test no packages': function () {
          this.testUniquePackages([], [])
        }

      , 'test single package': function () {
          this.testUniquePackages([ 'apkg' ], [ 'apkg' ])
        }

      , 'test multiple unique package': function () {
          this.testUniquePackages(
              [ 'apkg', 'foo', 'bar' ]
            , [ 'apkg', 'foo', 'bar' ]
          )
        }

      , 'test multiple packages with dupes': function () {
          this.testUniquePackages(
              [ 'apkg', 'foo', 'apkg', 'bar', 'bar' ]
            , [ 'apkg', 'foo', 'bar' ]
          )
        }

      , 'test multiple packages with dupes and versions': function () {
          // There is a question here about versioning, perhaps if there is an unversioned
          // and a versioned of the same package then include the versioned one? How about
          // when 2 different versions of the same package are specified
          this.testUniquePackages(
              [ 'apkg', 'foo', 'apkg@0.1', 'bar', 'bar', 'bar@2.0.0', 'yo@0.0.1' ]
            , [ 'apkg', 'foo', 'bar', 'yo@0.0.1' ]
          )
        }
    }

  , 'isBasePackage': {
        'test not base package': function () {
          refute(buildUtil.isBasePackage({}, 'foobar'))
        }

      , 'test default client package': function () {
          assert(buildUtil.isBasePackage({}, 'ender-core'))
        }

      , 'test default module package': function () {
          assert(buildUtil.isBasePackage({}, 'ender-commonjs'))
        }
    }
})