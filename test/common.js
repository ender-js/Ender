var buster = require('buster')

buster.assertions.add('isString', {
    assert: function (actual) {
      return typeof actual == 'string'
    }
  , assertMessage: 'expected ${0} to be a string'
})
buster.assertions.add('isArray', {
    assert: function (actual) {
      return Array.isArray(actual)
    }
  , assertMessage: 'expected ${0} to be an Array'
})
buster.assertions.add('fail', {
    assert: function () {
      return false
    }
  , assertMessage: '${0}'
})
buster.assertions.add('contains', {
    assert: function (actual, expected) {
      return Array.prototype.indexOf.call(actual, expected) != -1
    }
  , assertMessage: 'expected ${0} to contain ${1}'
  , refuteMessage: 'expected ${0} to not contain ${1}'
})
