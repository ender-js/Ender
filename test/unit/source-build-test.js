var testCase = require('buster').testCase
  , SourcePackage = require('../../lib/source-package')
  , SourceBuild = require('../../lib/source-build')
  , minify = require('../../lib/minify')
  , argsParse = require('../../lib/args-parse')

var createExpectedHeader = function (context, packageList) {
      return [
          "/*!"
        , "  * ============================================================="
        , "  * Ender: open module JavaScript framework (https://ender.no.de)"
        , "  * Build: ender " + context
        , "  * Packages: " + packageList
        , "  * ============================================================="
        , "  */"
      ].join('\n') + '\n\n'
    }

testCase('Source build', {
    'setUp': function () {
      this.createPackageMock = function (content, identifier) {
        var pkg = SourcePackage.create()
          , pkgMock = this.mock(pkg)
        pkgMock.expects('asString').once().callsArgWith(0, null, content)
        pkgMock.expects('getIdentifier').once().returns(identifier)
        return pkg
      }
      this.createArgsParseMock = function (optionsArg, contextArg) {
        var argsParseMock = this.mock(argsParse)
        argsParseMock.expects('toContextString').withExactArgs(optionsArg).once().returns(contextArg)
      }
    }

  , 'asString plain': function (done) {
      var pkg1Content = 'package 1\ncontents'
        , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
        , pkg2Content = 'package 2\n\ncontents'
        , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
        , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
        , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
        , optionsArg = { options: 1 }
        , srcBuild = SourceBuild.create(optionsArg)
        , contextArg = 'some context here & don\'t escape <this>'
        , plainSource =
              createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
            + pkg1Content + '\n\n'
            + pkg2Content + '\n\n'
            + pkg3Content
        , mockMinify = this.mock(minify)

      this.createArgsParseMock(optionsArg, contextArg)
      srcBuild.addPackage(pkg1)
      srcBuild.addPackage(pkg2)
      srcBuild.addPackage(pkg3)

      mockMinify.expects('minify').never()

      srcBuild.asString({ type: 'plain' }, function (err, actual) {
        refute(err)
        assert.equals(actual, plainSource)
        done()
      })
    }

  , 'asString minify': function (done) {
      var pkg1Content = 'package 1\ncontents'
        , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
        , pkg2Content = 'package 2\n\ncontents'
        , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
        , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
        , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
        , optionsArg = { options: 1 }
        , srcBuild = SourceBuild.create(optionsArg)
        , contextArg = 'some minified context here & don\'t escape <this>'
        , plainSource =
              createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
            + pkg1Content + '\n\n'
            + pkg2Content + '\n\n'
            + pkg3Content
        , minifiedSource = 'this is minified, these are not the droids you are looking for'
        , mockMinify = this.mock(minify)

      this.createArgsParseMock(optionsArg, contextArg)
      srcBuild.addPackage(pkg1)
      srcBuild.addPackage(pkg2)
      srcBuild.addPackage(pkg3)

      mockMinify.expects('minify').once().withArgs(plainSource).callsArgWith(1, null, minifiedSource)

      srcBuild.asString({ type: 'minified' }, function (err, actual) {
        refute(err)
        assert.equals(actual, minifiedSource)
        done()
      })
    }

  , 'asString sandboxed': function (done) {
      var pkg1Content = 'package 1\ncontents'
        , pkg1 = this.createPackageMock(pkg1Content, "pkg1@0.1.1")
        , pkg2Content = 'package 2\n\ncontents'
        , pkg2 = this.createPackageMock(pkg2Content, "pkg2@1.1.1")
        , pkg3Content = 'package 3\n\ncontents\nright\nhere\n'
        , pkg3 = this.createPackageMock(pkg3Content, "pkg3@1.2.3")
        , optionsArg = { sandbox: [ 'foo', 'bar' ] }
        , srcBuild = SourceBuild.create(optionsArg)
        , contextArg = 'some context here & don\'t escape <this>'
        , plainSource =
              createExpectedHeader(contextArg, "pkg1@0.1.1 pkg2@1.1.1 pkg3@1.2.3")
            + '!function () {\n\n'
            + pkg1Content + '\n\n' + pkg2Content + '\n\n' + pkg3Content
            + '\n\n}.call({});'
        , mockMinify = this.mock(minify)

      this.createArgsParseMock(optionsArg, contextArg)
      srcBuild.addPackage(pkg1)
      srcBuild.addPackage(pkg2)
      srcBuild.addPackage(pkg3)

      mockMinify.expects('minify').never()

      srcBuild.asString({ type: 'plain' }, function (err, actual) {
        refute(err)
        assert.equals(actual, plainSource)
        done()
      })
    }
})
