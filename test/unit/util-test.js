var buster = require('buster')
  , assert = buster.assert
  , fs = require('fs')
  , path = require('path')
  , util = require('../../lib/util')

  , verifyWritable = function (name, dir, done) {
      path.exists(dir, function (exists) {
        if (!exists) {
          assert.fail(name + ' directory doesn\'t exist:: ' + dir)
          done()
        } else {
          var tmpFile = dir + '/ender_test.' + (+new Date)
          fs.writeFile(tmpFile, 'Test data', function (err) {
            if (err) {
              assert.fail('couldn\'t write to ' + name + ' file: ' + tmpFile)
                done()
            } else {
              fs.unlink(tmpFile, function (err) {
                if (err)
                  assert.fail('couldn\'t delete ' + name + ' file: ' + tmpFile)
                done()
              })
            }
          })
        }
      })
    }

buster.testCase('Util', {
    'directories': {
        'test util.tmp is a writeable directory': function (done) {
          assert.isString(util.tmpDir)
          verifyWritable('temp', util.tmpDir, done)
        }

      , 'test util.home is a writeable directory': function (done) {
          assert.isString(util.homeDir)
          verifyWritable('home', util.homeDir, done)
        }
    }

  , 'extend': {
        'test basic extend()': function () {
          var src = { 'one': 1, 'two': 2 }
            , dst = { 'two': 2.2, 'three': 3 }

            , actual = util.extend(src, dst)

          assert.same(actual, dst) // the return is just a convenience

          assert.equals(Object.keys(actual).length, 3)
          assert.equals(actual.one, src.one)
          assert.equals(actual.two, 2.2) // didn't overwrite existing property
          assert.equals(actual.three, 3)

          // left src untouched?
          assert.equals(Object.keys(src).length, 2)
          assert.equals(src.one, 1)
          assert.equals(src.two, 2)
        }
    }

  , 'mkdir': {
        'test mkdir nonexistant': function (done) {
          var dir = '/tmp/' + Math.random() + '.' + process.pid + '.test'
          util.mkdir(dir, function (err) {
            refute(err, 'no error from mkdir()')
            path.exists(dir + '/', function (exists) {
              assert(exists, 'directory exists')
              fs.rmdir(dir, done)
            })
          })
        }

      , 'test mkdir already exists': function (done) {
          var dir = '/tmp/' + Math.random() + '.' + process.pid + '.test'
          fs.mkdir(dir, function (err) {
            refute(err, 'no error from fs.mkdir()')
            util.mkdir(dir, function (err) {
              refute(err, 'no error from mkdir()')
              path.exists(dir + '/', function (exists) {
                assert(exists, 'directory exists')
                fs.rmdir(dir, done)
              })
            })
          })
        }
    }

})
