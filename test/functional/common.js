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


var buster = require('buster')
  , childProcess = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , rimraf = require('rimraf')
  , util = require('../../lib/util')

  , makeSourceProvideRegex = function (pkg) {
      return RegExp('[;, ]provide\\("' + pkg + '", ?\\w+\\.exports\\)[;,]')
    }
buster.assertions.add('sourceHasProvide', {
    assert: function (source, pkg, file) {
      var re = makeSourceProvideRegex(pkg)
      this.times = source.split(re).length - 1
      return this.times == 1
    }
  , assertMessage: '${2} contains provide("${1}") [${times} time(s), expected 1]'
})

buster.assertions.add('sourceHasStandardWrapFunction', {
    assert: function (source, pkg, file) {
      var re = new RegExp('\\s*\\}\\([\'"]' + pkg + '[\'"],.*?function\\s*\\([^\\)]*\\)\\s*\\{')
      this.times = source.split(re).length - 1
      return this.times == 1
    }
  , assertMessage: '${2} contains standard wrapper function for ${1} [${times} time(s), expected 1]'
})

buster.assertions.add('sourceContainsProvideStatements', {
    assert: function (source, times, file) {
      var re = makeSourceProvideRegex('[\\w\\-]+')
      this.times = source.split(re).length - 1
      return this.times == times
    }
  , assertMessage: '${2} contains ${1} provide() statements [${times} time(s), expected ${1}]'
})

buster.assertions.add('sourceHasProvidesInOrder', {
    assert: function (source, pkg1, pkg2, file) {
      var re1 = makeSourceProvideRegex(pkg1)
        , re2 = makeSourceProvideRegex(pkg2)
        , idx1 = source.search(re1)
        , idx2 = source.search(re2)
      return idx1 < idx2
    }
  , assertMessage: '${3} has provide("${1}") before provide("${2}")'
})

buster.assertions.add('hasVersionedPackage', {
    assert: function (txt, pkg, sourceName) {
      return new RegExp(pkg + '@\\d+\\.\\d+\\.\\d+').test(txt)
    }
  , assertMessage: '${2} refers to ${1} versioned'
})

buster.assertions.add('stdoutRefersToNPMPackages', {
    assert: function (stdout, packages) {
      return new RegExp('npm.*"' + packages + '"').test(stdout)
    }
  , assertMessage: 'stdout refers to "${1}" from npm'
})

buster.assertions.add('stdoutReportsBuildCommand', {
    assert: function (stdout, buildCommand) {
      return new RegExp('current build command is:.*' + buildCommand, 'i').test(stdout)
    }
  , assertMessage: 'stdout reports correct build command "${1}"'
})

buster.assertions.add('stdoutReportsOutputSizes', {
    assert: function (stdout) {
      return (/current build size is: .*[\d\.]+ kB.* raw, .*[\d\.]+ kB.* minified and .*[\d\.]+ kB.* gzipped/).test(stdout)
    }
  , assertMessage: 'stdout reports build sizes ${0}'
})

var mktmpdir = function (callback) {
      var dir = util.tmpDir + '/ender_test_' + process.pid + '.' + (+new Date())
      fs.mkdir(dir, function (err) {
        callback(err, dir)
      })
    }

  , rmtmpdir = function (dir, callback) {
      rimraf(dir, callback)
    }

  , enderpath = path.resolve(__dirname, '../../bin/ender')

  , runEnder = function (cmd, expectedFiles, dir, callback) {
      var run = function (dir) {
        childProcess.exec(
            enderpath + ' ' + cmd
          , { cwd: dir, env: process.env }
          , function (err, stdout, stderr) {
              async.map(
                  expectedFiles
                , function (f, callback) {
                    f = path.join(dir, f)
                    fs.stat(f, function (err, stats) {
                      refute(err, f + ' exists')
                      if (err)
                        return callback()
                      assert(stats && stats.isFile(), f + ' is a file')
                      assert(stats && stats.size > 0, f + ' is a non-zero size')
                      fs.readFile(f, 'utf-8', callback)
                    })
                  }
                , function (_err, fileContents) {
                    callback(err, dir, fileContents, String(stdout), String(stderr), function (callback) {
                      rmtmpdir(dir, callback)
                    })
                  }
              )
            }
        )
      }

      if (typeof dir == 'function') {
        callback = dir
        mktmpdir(function (err, dir) {
          refute(err)
          if (err)
            return callback(err)
          run(dir)
        })
      } else
        run(dir)
    }

  , verifyNodeModulesDirectories = function (root, expectedDirectories, callback) {
      fs.readdir(path.join(root, 'node_modules'), function (err, actualDirectories) {
        refute(err)
        if (err)
          return callback(err)
        assert.equals(actualDirectories.length, expectedDirectories.length)
        assert.equals(actualDirectories.sort(), expectedDirectories.sort())
        callback()
      })
    }

module.exports = {
    enderpath: enderpath
  , runEnder: runEnder
  , verifyNodeModulesDirectories: verifyNodeModulesDirectories
}
