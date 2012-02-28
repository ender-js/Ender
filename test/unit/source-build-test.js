var testCase = require('buster').testCase
  , SourcePackage = require('../../lib/source-package')
  , SourceBuild = require('../../lib/source-build')

testCase('Source build', {
    'setUp': function () {
      this.createPackageMock = function (content) {
        var pkg = SourcePackage.create()
          , pkgMock = this.mock(pkg)
        pkgMock.expects('asString').once().callsArgWith(0, null, content)
        return pkg
      }
    }

  , 'asString': function (done) {
      var pkg1Content = 'package 1\ncontents'
        , pkg1 = this.createPackageMock(pkg1Content)
        , pkg2Content = 'package 2\n\ncontents'
        , pkg2 = this.createPackageMock(pkg2Content)
        , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
        , pkg3 = this.createPackageMock(pkg3Content)
        , srcBuild = SourceBuild.create()
        , expected = pkg1Content + '\n\n' + pkg2Content + '\n\n' + pkg3Content

      srcBuild.addPackage(pkg1)
      srcBuild.addPackage(pkg2)
      srcBuild.addPackage(pkg3)

      srcBuild.asString(function (err, actual) {
        refute(err)
        assert.equals(actual, expected)
        done()
      })
    }

})

