var testCase = require('buster').testCase
  , childProcess = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , rimraf = require('rimraf')
  , util = require('../../lib/util')

testCase('Functional: dependencies', {
    'setUp': function () {
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

      this.timeout = 60000
      assert.match.message = '${2}'

      this.runEnder = function (cmd, callback) {
        mktmpdir(function (err, dir) {
          refute(err)
          childProcess.exec(
              enderpath + ' ' + cmd
            , { cwd: dir, env: process.env }
            , function (err, stdout, stderr) {
                callback(err, dir, String(stdout), String(stderr), function (callback) {
                  rmtmpdir(dir, callback)
                })
              }
          )
        })
      }
    }

  , 'ender build jeesh': function (done) {
      this.runEnder('build jeesh', function (err, dir, stdout, stderr, callback) {
        refute(err)
        refute(stderr)
        stdout = String(stdout)
        assert.match(stdout, /npm.*"ender-js jeesh"/i, 'stdout refers to "ender-js jeesh" from npm')
        assert.match(stdout, /current build command is:.*ender build jeesh/i, 'stdout reports correct build command')
        assert.match(
            stdout
          , /current build size is: .*[\d\.]+ kB.* raw, .*[\d\.]+ kB.* minified and .*[\d\.]+ kB.* gzipped/i
          , 'stdout reports build sizes'
        )
        assert.match(stdout, /jeesh@\d+\.\d+\.\d+/, 'stdout refers to jeesh with version')
        assert.match(stdout, /domready@\d+\.\d+\.\d+/, 'stdout refers to domready with version')
        assert.match(stdout, /qwery@\d+\.\d+\.\d+/, 'stdout refers to qwery with version')
        assert.match(stdout, /bonzo@\d+\.\d+\.\d+/, 'stdout refers to bonzo with version')
        assert.match(stdout, /bean@\d+\.\d+\.\d+/, 'stdout refers to bean with version')

        fs.readFile(path.join(dir, 'ender.js'), 'utf-8', function (err, data) {
          refute(err, 'ender.js exists')
          assert.match(data, /Build: ender build jeesh$/m, 'ender.js contains correct build command')
          assert.match(data, /^\s+\}\('domready', function\s*\(\w*\)\s*\{$/m, 'ender.js contains domready')
          assert.match(data, /^ {2}provide\("domready", module\.exports\);$/m, 'ender.js contains provide("domready")')
          assert.match(data, /^\s+\}\('qwery', function\s*\(\)\s*\{$/m, 'ender.js contains qwery')
          assert.match(data, /^ {2}provide\("qwery", module\.exports\);$/m, 'ender.js contains provide("qwery")')
          assert.match(data, /^\s+\}\('bonzo', function\s*\(\)\s*\{$/m, 'ender.js contains bonzo')
          assert.match(data, /^ {2}provide\("bonzo", module\.exports\);$/m, 'ender.js contains provide("bonzo")')
          assert.match(data, /^\s+\}\('bean',.* function\s*\([^\)]*\)\s*\{$/m, 'ender.js contains bean')
          assert.match(data, /^ {2}provide\("bean", module\.exports\);$/m, 'ender.js contains provide("bean")')
          callback(done)
        })
      })
    }
})