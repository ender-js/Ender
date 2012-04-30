var testCase = require('buster').testCase
  , PackageDescriptor = require('../../lib/PackageDescriptor')

testCase('PackageDescriptor', {
      'test missing "ender" property': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
        })
        refute.defined(packageDescriptor.ender)
      }

    , 'test standard "ender" property': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
          , ender: 'noop'
        })
        assert.equals(packageDescriptor.ender, 'noop')
      }

    , 'test ender override "ender" property': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
          , ender: { ender: 'yohoho' }
        })
        assert.equals(packageDescriptor.ender, 'yohoho')
      }

    , 'test standard name': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
        })
        assert.equals(packageDescriptor.name, 'foobar!')
      }

    , 'test ender override name': function () {
        var packageDescriptor = PackageDescriptor.create({
            name: 'foobar!'
          , ender: { name: 'bam!' }
        })
        assert.equals(packageDescriptor.name, 'bam!')
      }

    , 'test standard dependencies': function () {
        var expected = { foo: '*', bar: '*' }
          , packageDescriptor = PackageDescriptor.create({
                dependencies: expected
            })
        assert.same(packageDescriptor.dependencies, expected)
      }

    , 'test ender override dependencies': function () {
        var expected = { fat: '*', fatter: '*' }
          , packageDescriptor = PackageDescriptor.create({
                dependencies: { foo: '*', bar: '*' }
              , ender: { dependencies: expected }
            })
        assert.same(packageDescriptor.dependencies, expected)
      }

    , 'test standard main': function () {
        var expected = [ 'foobar!' ]
          , packageDescriptor = PackageDescriptor.create({
                main: expected
            })
        assert.same(packageDescriptor.main, expected)
      }

    , 'test ender override main': function () {
        var expected = [ 'iiii am a mannnnn of constant sorrowwwww' ]
          , packageDescriptor = PackageDescriptor.create({
                main: [ 'wha?' ]
              , ender: { main: expected }
            })
        assert.same(packageDescriptor.main, expected)
      }

})