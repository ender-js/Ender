var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , mainVersion = require('../../lib/main-version')
  , mainVersionOut = require('../../lib/output/main-version-output').create()

testCase('Version', {
    'test version': function (done) {
      var fsMock = this.mock(fs)
        , outMock = this.mock(mainVersionOut)

      fsMock.expects('readFile')
        .once()
        .withArgs(path.resolve(__dirname, '../../package.json'), 'utf-8')
        .callsArgWith(2, null, '{ "version": "foobar" }')
      outMock.expects('version').once().withArgs('foobar')
      mainVersion.exec({}, mainVersionOut, function (err) {
        refute(err)
        done()
      })
    }
})

