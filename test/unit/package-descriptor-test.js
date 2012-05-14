var testCase = require('buster').testCase
  , PackageDescriptor = require('../../lib/package-descriptor')
testCase('PackageDescriptor', {
      'setUp': function () {
        this.runTest = function (json, key, expected, same) {
          var packageDescriptor = PackageDescriptor.create(json)
          key = Array.isArray(key) ? key : [ key ]
          expected = Array.isArray(expected) ? expected : [ expected ]
          same = typeof same == 'undefined' ? [ false ] : Array.isArray(same) ? same : [ same ]
          key.forEach(function (k, i) {
            assert[same[i] ? 'same' : 'equals'](packageDescriptor[key[i]], expected[i])
          })
        }
      }
    , 'test missing "ender" property': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
        })
        refute.defined(packageDescriptor.ender)
      }
    , 'test standard "ender" property': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: 'noop'
            }
          , 'ender'
          , 'noop'
        )
      }
    , 'test ender override "ender" property': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: { ender: 'yohoho' }
            }
          , 'ender'
          , 'yohoho'
        )
      }
    , 'test "ender->name" property replaces non-existent root': function () {
        this.runTest(
            { ender: { name: 'yohoho' } }
          , 'name'
          , 'yohoho'
        )
      }
    , 'test "overlay->ender->name" property replaces non-existent root': function () {
        this.runTest(
            { overlay: { ender: { name: 'yohoho' } } }
          , 'name'
          , 'yohoho'
        )
      }
    , 'test ender override "ender" property with "overlay->ender"': function () {
        this.runTest(
            {
                ender: 'foobar!'
              , overlay: { ender: { ender: 'yohoho' } }
            }
          , 'ender'
          , 'yohoho'
        )
      }
    , 'test standard name': function () {
        this.runTest(
            { name: 'foobar!' }
          , 'name'
          , 'foobar!'
        )
      }
    , 'test ender override name': function () {
        this.runTest(
            {
                name: 'foobar!'
              , ender: { name: 'bam!' }
            }
          , 'name'
          , 'bam!'
        )
      }
    , 'test ender override name wtih "overlay->ender"': function () {
        this.runTest(
            {
                name: 'foobar!'
              , overlay: { ender: { name: 'bam!' } }
            }
          , 'name'
          , 'bam!'
        )
      }
    , 'test standard dependencies': function () {
        var expected = { foo: '*', bar: '*' }
        this.runTest(
            { dependencies: expected }
          , 'dependencies'
          , expected
          , true
        )
      }
    , 'test ender override dependencies': function () {
        var expected = { fat: '*', fatter: '*' }
        this.runTest(
            {
                dependencies: { foo: '*', bar: '*' }
              , ender: { dependencies: expected }
            }
          , 'dependencies'
          , expected
          , true
        )
      }
    , 'test ender override dependencies with "overlay->ender"': function () {
        var expected = { fat: '*', fatter: '*' }
        this.runTest(
            {
                dependencies: { foo: '*', bar: '*' }
              , overlay: { ender: { dependencies: expected } }
            }
          , 'dependencies'
          , expected
          , true
        )
      }
    , 'test standard main': function () {
        var expected = [ 'foobar!' ]
        this.runTest(
            { main: expected }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }
    , 'test ender override main': function () {
        var expected = [ 'iiii am a mannnnn of constant sorrowwwww' ]
        this.runTest(
            {
                main: [ 'wha?' ]
              , ender: { main: expected }
            }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }
    , 'test ender override main with "overlay->ender"': function () {
       var expected = [ 'iiii am a mannnnn of constant sorrowwwww' ]
        this.runTest(
            {
                main: [ 'wha?' ]
              , overlay: { ender: { main: expected } }
            }
          , [ 'main' ]
          , [ expected ]
          , [ true ]
        )
      }
    , 'test if no override property then no override': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: expectedMain
              , name: 'who?'
              , ender: { bogus: 'main and name properties not in here so should use root values' }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'who?' ]
          , [ true, false ]
        )
      }
    , 'test if no overlay override property then no override': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: expectedMain
              , name: 'who?'
              , overlay: {
                    ender: {
                        bogus: 'main and name properties not in here so should use root values'
                    }
                }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'who?' ]
          , [ true, false ]
        )
      }
    , 'test "ender" gets preference over "override->ender"': function () {
        var expectedMain = [ 'wha?' ]
        this.runTest(
            {
                main: [ 'nah' ]
              , name: 'who?"'
              , ender: {
                    main: expectedMain
                  , name: 'mary had a little lamb'
                }
              , overlay: {
                    ender: {
                        main: [ 'bam!' ]
                      , name: 'nonono"'
                    }
                }
            }
          , [ 'main', 'name' ]
          , [ expectedMain, 'mary had a little lamb' ]
          , [ true, false ]
        )
      }
})