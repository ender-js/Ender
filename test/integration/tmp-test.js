var buster = require('buster')
  , assert = buster.assert

buster.testCase('integration', {
  'failure': function () {
    assert(false)
  }
})
