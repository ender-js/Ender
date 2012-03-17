var testCase = require('buster').testCase
  , ender = require('../../lib/main')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')

testCase('Functional: version', {
    'setUp': function () {
      this.output = []
      var utilStub = this.stub(util, 'print', function (s) {
        this.output.push(s)
      }.bind(this))
    }

  , 'exec version (API)': function (complete) {
      fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf-8', function (err, contents) {
        refute(err, 'read package.json')

        var expectedVersion = contents.match(/"version"\s*:\s*"([^"]+)"/)[1]

        ender.exec('ender version', function () {
          var actualVersionString

          this.output.forEach(function (str) {
            if (/^Active /.test(str))
              actualVersionString = str.replace(/[^\w\:\s\.]/, '')
          }.bind(this))

          assert.equals('Active version: v' + expectedVersion, actualVersionString , 'printed correct version string')
          complete()
        }.bind(this))
      }.bind(this))
    }
})
