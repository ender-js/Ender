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


var testCase          = require('buster').testCase
  , fs                = require('fs')
  , path              = require('path')
  , async             = require('async')
  , mkfiletree        = require('mkfiletree')
  , sourcePackageUtil = require('../../lib/source-package-util')


testCase('Source package util', {
    'tearDown': function (done) {
      mkfiletree.cleanUp(done)
    }

  , 'loadFiles': {
        // note: we expect globs to return a sorted list of files (dirname(s) included)

        'test single file with exact name': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , { 'foo.js': 'fooish!' }
            , function (err, dir) {
                refute(err)
                sourcePackageUtil.loadFiles(dir, [ 'foo.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [ { file: path.join(dir, 'foo.js'), contents: 'fooish!' } ]
                  )
                  done()
                })
              }
          )
        }

      , 'test single file with glob': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , { 'foo.js': 'fooish!' }
            , function (err, dir) {
                refute(err)
                sourcePackageUtil.loadFiles(dir, [ '**/*.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [ { file: path.join(dir, 'foo.js'), contents: 'fooish!' } ]
                  )
                  done()
                })
              }
          )
        }

      , 'test lots of files, one glob to rule them all': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , {
                  'foo.js': 'fooish!'
                , 'bar': {
                      'baz.js': 'baz!'
                    , 'bang.js': 'bang!'
                    , 'boo': { '1.js': 'boo!!', '2.js': 'boo!!!' }
                  }
              }
            , function (err, dir) {
                refute(err)

                sourcePackageUtil.loadFiles(dir, [ '**/*.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [
                          { file: path.join(dir, 'bar/bang.js'), contents: 'bang!' }
                        , { file: path.join(dir, 'bar/baz.js'), contents: 'baz!' }
                        , { file: path.join(dir, 'bar/boo/1.js'), contents: 'boo!!' }
                        , { file: path.join(dir, 'bar/boo/2.js'), contents: 'boo!!!' }
                        , { file: path.join(dir, 'foo.js'), contents: 'fooish!' }
                      ]
                  )
                  done()
                })
              }
          )
        }

      , 'test lots of files, cherry pick specifics': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , {
                  'foo.js': 'fooish!'
                , 'bar': {
                      'baz.js': 'baz!'
                    , 'bang.js': 'bang!'
                    , 'boo': { '1.js': 'boo!!', '2.js': 'boo!!!' }
                  }
              }
            , function (err, dir) {
                refute(err)

                sourcePackageUtil.loadFiles(dir, [ 'foo.js', './bar/bang.js', '/bar/boo/2.js', 'bar/baz.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [
                          { file: path.join(dir, 'foo.js'), contents: 'fooish!' }
                        , { file: path.join(dir, 'bar/bang.js'), contents: 'bang!' }
                        , { file: path.join(dir, 'bar/boo/2.js'), contents: 'boo!!!' }
                        , { file: path.join(dir, 'bar/baz.js'), contents: 'baz!' }
                      ]
                  )
                  done()
                })
              }
          )
        }

      , 'test lots of files, shallow glob': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , {
                  'foo.js': 'fooish!'
                , 'bar': {
                      'baz.js': 'baz!'
                    , 'bang.js': 'bang!'
                    , 'boo': { '1.js': 'boo!!', '2.js': 'boo!!!' }
                  }
              }
            , function (err, dir) {
                refute(err)

                sourcePackageUtil.loadFiles(dir, [ '*.js', 'bar/baz.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [
                          { file: path.join(dir, 'foo.js'), contents: 'fooish!' }
                        , { file: path.join(dir, 'bar/baz.js'), contents: 'baz!' }
                      ]
                  )
                  done()
                })
              }
          )
        }

      , 'test lots of files, deep, specific glob': function (done) {
          mkfiletree.makeTemp(
              'ender-test-source-package-util'
            , {
                  'foo.js': 'fooish!'
                , 'bar': {
                      'baz.js': 'baz!'
                    , 'bang.js': 'bang!'
                    , 'boo': { '1.js': 'boo!!', '2.js': 'boo!!!' }
                  }
              }
            , function (err, dir) {
                refute(err)

                sourcePackageUtil.loadFiles(dir, [ '*/*/*.js' ], function (err, contents) {
                  refute(err)
                  assert.equals(
                      contents
                    , [
                          { file: path.join(dir, 'bar/boo/1.js'), contents: 'boo!!' }
                        , { file: path.join(dir, 'bar/boo/2.js'), contents: 'boo!!!' }
                      ]
                  )
                  done()
                })
              }
          )
        }
    }
})