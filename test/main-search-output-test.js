require('./common')
var buster = require('buster')
  , assert = buster.assert
  , SearchOutput = require('../lib/main-search-output')

buster.testCase('Search output', {
    setUp: function () {
      // emulate `require('util')`
      this.out = {
          buf: ''
        , print: function(s) {
            this.buf += s
          }
      }
      this.output = SearchOutput.create()
    }

  , 'test searchInit()': function () {
      this.output.init(this.out)
      this.output.searchInit()
      assert.match(this.out.buf, 'Searching NPM registry...')
    }

  , 'test searchNoResults()': function () {
      this.output.init(this.out)
      this.output.searchNoResults()
      assert.match(this.out.buf, 'Sorry, we couldn\'t find anything')
    }

  , 'test searchError() with debug=false': function () {
      this.output.init(this.out, false)
      this.output.searchError(new Error())
      assert.match(this.out.buf, 'Something went wrong searching NPM')
    }

  , 'test searchError() with debug=true': function () {
      this.output.init(this.out, true)
      assert.exception(function () {
        this.output.searchError(new Error())
      })
    }
})
