var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , colorsTmpl = require('colors-tmpl')
  , mainHelp = require('../../lib/main-help')
  , mainHelpOut = require('../../lib/main-help-output').create()

testCase('Help', {
    'setUp': function () {
      this.runTest = function (options, expectedFilename, exists, done) {
        var fsMock = this.mock(fs)
          , pathMock = this.mock(path)
          , colorsTmplMock = this.mock(colorsTmpl)
          , mainHelpOutMock = this.mock(mainHelpOut)
          , contentsArg = { contents: 1 }
          , renderedArg = { rendered: 1 }
        
        expectedFilename = path.join(path.resolve(__dirname, '../../resources/help/'), expectedFilename)
        pathMock.expects('existsSync').once().withExactArgs(expectedFilename).returns(exists)
        if (exists) {
          fsMock.expects('readFileSync').once().withExactArgs(expectedFilename, 'utf-8').returns(contentsArg)
          colorsTmplMock
            .expects('render')
            .once()
            .withExactArgs(contentsArg)
            .returns(renderedArg)
          mainHelpOutMock.expects('showDocument').once().withExactArgs(renderedArg)
        } else
          mainHelpOutMock.expects('noSuchCommand').once().withExactArgs(path.basename(expectedFilename, '.tmpl' ))

        mainHelp.exec(options, mainHelpOut, function (err) {
          refute(err)
          done()
        })
      }
    }
  , 'test no args': function (done) {
      this.runTest({ packages: [] }, 'main.tmpl', true, done)
    }

  , 'test existing help file': function (done) {
      this.runTest({ packages: [ 'foobar' ] }, 'foobar.tmpl', true, done)
    }

  , 'test non-existant help file': function (done) {
      this.runTest({ packages: [ 'foobar' ] }, 'foobar.tmpl', false, done)
    }

})