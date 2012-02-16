var buster = require('buster')
  , assert = buster.assert
  , searchUtil = require('../../lib/main-search-util')

buster.testCase('Search util', {
    'test escapeRegExp plain strings': function () {
      assert.equals(searchUtil.escapeRegExp(''), '')
      assert.equals(searchUtil.escapeRegExp('vanilla'), 'vanilla')
    }

  , 'test escapeRegExp escapable strings': function () {
      assert.equals(searchUtil.escapeRegExp('-[]{}()*+?.\\^$|,# '), '\\-\\[\\]\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|\\,\\#\\ ')
    }

  , 'test sortByRegExp': function () {
      var regex = /a|D|6|I$/ // match 0, 1 & 3 ('6' is ignored because it's not in priority list
        , array = [
              { p1: 'abc', p2: '123', p3: 'ABC' }
            , { p1: 'cde', p2: '345', p3: 'CDE' }
            , { p1: 'efg', p2: '567', p3: 'EFG' }
            , { p1: 'ghi', p2: '789', p3: 'GHI' }
          ]
        , arrayCopy = [ array[0], array[1], array[2], array[3] ]
        , ranked = []
        , priority = [ 'p3', 'p1' ] // means we should get, in order: 1, 3, 0

      searchUtil.sortByRegExp(regex, arrayCopy, ranked, priority)

      assert.equals(ranked.length, 3)
      assert.same(ranked[0], array[1])
      assert.same(ranked[1], array[3])
      assert.same(ranked[2], array[0])

      assert.equals(arrayCopy.length, 1)
      assert.same(arrayCopy[0], array[2])
    }
})
