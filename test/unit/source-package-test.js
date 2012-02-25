var testCase = require('buster').testCase
  , fs = require('fs')
  , path = require('path')
  , sourcePackage = require('../../lib/source-package')

testCase('Source package', {
    'setUp': function () {
      this.runAsStringTest =
          function (expectedFileReads, fileContents, readDelays, parents, pkg, json, expectedResult, done) {

        var fsMock = this.mock(fs)

        expectedFileReads.forEach(function (file, index) {
          var exp = fsMock.expects('readFile')
            .withArgs(
                path.resolve(file)
              , 'utf-8'
            )
          if (!readDelays)
            exp.callsArgWith(2, null, fileContents[index])
          else {
            setTimeout(function () {
              exp.args[0][2].call(null, null, fileContents[index])
            }, readDelays[index])
          }
        })

        sourcePackage.create(parents, pkg, json).asString(function (err, actual) {
          refute(err)
          assert.equals(actual, expectedResult)
          done()
        })
      }
    }

  , 'test (single) main-only toString without .js extension': function (done) {
      this.runAsStringTest(
          [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ] // files
        , [ 'mainsrc contents' ] // contents
        , null // delays
        , [ 'parent1', 'parent2' ] // parents
        , 'apkg' // package
        , { main: 'lib/mainsrc' } // package.json
        , 'mainsrc contents' // expected result
        ,  done
      )
    }

  , 'test (single) main-only toString with .js extension': function (done) {
      this.runAsStringTest(
          [ 'node_modules/parent1/node_modules/parent2/node_modules/apkg/lib/mainsrc.js' ] // files
        , [ 'mainsrc.js contents' ] // contents
        , null // delays
        , [ 'parent1', 'parent2' ] // parents
        , 'apkg' // package
        , { main: 'lib/mainsrc.js' } // package.json
        , 'mainsrc.js contents' // expected result
        ,  done
      )
    }

  , 'test (multiple) main-only toString (mixed extensions)': function (done) {
      this.runAsStringTest(
          [
              'node_modules/mypkg/lib/mainsrc.js'
            , 'node_modules/mypkg/lib/foo/bar.js'
            , 'node_modules/mypkg/lib/foo/bar/baz.js'
          ] // files
        , [
              'mainsrc.js contents'
            , 'BAR!'
            , 'BAZ!'
          ] // contents
        , null // delays
        , [] // parents
        , 'mypkg' // package
        , {
              main: [
                  'lib/mainsrc.js'
                , 'lib/foo/bar'
                , 'lib/foo/bar/baz'
              ]
          } // package.json
        , 'mainsrc.js contents\n\nBAR!\n\nBAZ!' // expected result
        ,  done
      )
    }

  , 'test (multiple) main-only toString (mixed extensions) with out-of-order read returns': function (done) {
      // test that even though we read the source files in parallel that they get stitched together
      // in the right order in the end. Delay the callbacks from the reads to emulate out-of-order
      // filesystem reads
      this.runAsStringTest(
          [
              'node_modules/mypkg/lib/mainsrc.js'
            , 'node_modules/mypkg/lib/foo/bar.js'
            , 'node_modules/mypkg/lib/foo/bar/baz.js'
          ] // files
        , [
              'mainsrc.js contents'
            , 'BAR!'
            , 'BAZ!'
          ] // contents
        , [ 100, 50, 0 ] // delays
        , [] // parents
        , 'mypkg' // package
        , {
              main: [
                  'lib/mainsrc.js'
                , 'lib/foo/bar'
                , 'lib/foo/bar/baz'
              ]
          } // package.json
        , 'mainsrc.js contents\n\nBAR!\n\nBAZ!' // expected result
        ,  done
      )
    }
})
