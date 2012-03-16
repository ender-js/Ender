var buster = require('buster')
  , childProcess = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , rimraf = require('rimraf')
  , util = require('../../lib/util')

buster.assertions.add('sourceHasProvide', {
    assert: function (source, pkg, file) {
      return new RegExp('[;, ]provide\\("' + pkg + '", ?\\w+\\.exports\\)[;,]').test(source)
    }
  , assertMessage: '${2} contains provide("${1}")'
})

buster.assertions.add('sourceHasStandardWrapFunction', {
    assert: function (source, pkg, file) {
      return new RegExp('\\s*\\}\\([\'"]' + pkg + '[\'"],.*?function\\s*\\([^\\)]*\\)\\s*\\{').test(source)
    }
  , assertMessage: '${2} contains standard wrapper function for ${1}'
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

  , runEnder = function (cmd, expectedFiles, callback) {
      mktmpdir(function (err, dir) {
        refute(err)
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
      })
    }

module.exports = {
    enderpath: enderpath
  , runEnder: runEnder
}
