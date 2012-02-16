var testCase = require('buster').testCase
  , buildUtil = require('../../lib/main-build-util')
  , util = require('../../lib/util')
  , repository = require('../../lib/repository')
  , build = require('../../lib/main-build')

testCase('Build', {
    'test exec() calls setup(), install() and packup() on repository': function () {
      var mock = this.mock(repository)
        , mockUtil = this.mock(util)

      mockUtil.expects('mkdir').once().withArgs('node_modules').callsArg(1)

      mock.expects('setup').once().callsArg(0)
      var installExpectation = mock.expects('install').once().callsArg(1)
      mock.expects('packup').once()

      build.exec({ remaining: [ 'package' ] })

      assert.equals(installExpectation.args[0][0], [ 'ender-js', 'package' ])
      assert.isFunction(installExpectation.args[0][1]) // internal 'handle()' method
    }

  , 'test main-build-util interaction': function (done) {
      var mockRepository = this.mock(repository)
        , mockUtil = this.mock(util)
        , mockBuildUtil = this.mock(buildUtil)
        , out = require('../../lib/main-build-output').create(1)
        , outMock = this.mock(out)

        , args = { args: 1 }
        , packages = { packages: 1 }
        , installedArg = { installed: 1 }
        , treeArg = { tree: 1 }
        , prettyArg = { pretty: 1 }

      mockRepository.expects('setup').once().callsArg(0)
      mockRepository.expects('packup').once()
      mockRepository.expects('install').once().callsArgWith(1, null, installedArg, treeArg, prettyArg)

      mockUtil.expects('mkdir').once().withArgs('node_modules').callsArg(1)

      mockBuildUtil.expects('packageList').once().withExactArgs(args).returns(packages)

      outMock.expects('buildInit').once()
      outMock.expects('repositoryError').never()
      outMock.expects('installedFromRepository').once().withArgs(installedArg, treeArg, prettyArg)

      // execute
      build.exec(args, out, done)

      assert(true) // required, buster bug
    }
})

