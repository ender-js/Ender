require('./common')
var buster = require('buster')
  , assert = buster.assert
  , Output = require('../lib/output')

buster.testCase('Output (base)', {
    setUp: function () {
      // emulate `require('util')`
      this.out = {
          buf: ''
        , print: function(s) {
            this.buf += s
          }
      }
      this.output = Output.create()
    }

  , 'test log(str)': function () {
      this.output.init(this.out)
      this.output.log('a string')
      assert.equals(this.out.buf, 'a string\n')
    }

  , 'test debug(str) with debug=false': function () {
      this.output.init(this.out)
      this.output.debug('a string')
      assert.equals(this.out.buf, '')
    }

  , 'test debug(str) with debug=true': function () {
      this.output.init(this.out, true)
      this.output.debug('a string')
      assert.equals(this.out.buf, 'DEBUG: a string\n')
    }

  , 'test repositoryLoadError() with debug=false': function () {
      this.output.init(this.out, false)
      this.output.repositoryLoadError(new Error())
      assert.match(this.out.buf, 'Something went wrong trying to load NPM')
    }

  , 'test repositoryLoadError() with debug=true': function () {
      this.output.init(this.out, true)
      assert.exception(function () {
        this.output.repositoryLoadError(new Error())
      })
    }

  , 'test heading() short': function () {
      this.output.init(this.out)
      this.output.heading('This is a heading')
      assert.match(this.out.buf, /This is a heading[^\n]*\n-----------------/)
    }

  , 'test heading() long': function () {
      this.output.init(this.out)
      this.output.heading('H1')
      assert.match(this.out.buf, /H1[^\n]*\n--/)
    }

  , 'test heading() with meta': function () {
      this.output.init(this.out)
      this.output.heading('H1', 'h2')
      assert.match(this.out.buf, /H1[^\n ]* \(h2\)[^\n]*\n--/)
    }

})
