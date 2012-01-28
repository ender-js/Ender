    // make a string regex friendly by escaping regex characters
    // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
var escapeRegExp = function (string) {
      return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function (match) {
        return '\\' + match
      })
    }

    // given a regex, an array of objects and an array of properties prioritised, populate a ranked
    // array with objects whose properties match the regex in priority order. elements get removed
    // from source array when they are put into the priority array.
    // array: [ { a: '1;, b: '2' }, { a: '3', b: '4' } ]
    // ranked: [] (effective return)
    // priority: [ 'a', 'b' ] (properties in 'array' elements)
  , sortByRegExp = function (regex, array, ranked, priority) {
      for (var i = 0; i < priority.length; i++) {
        var p = priority[i]
        for (var j = 0; j < array.length; j++) {
          if (typeof array[j][p] == 'string' && regex.test(array[j][p])) {
            ranked.push(array.splice(j, 1)[0])
            j--
          } else if (array[j][p] && typeof array[j][p] != 'string') {
            for (var m = 0; m < array[j][p].length; m++) {
              if (regex.test(array[j][p][m])) {
                ranked.push(array.splice(j, 1)[0])
                j--
                break
              }
            }
          }
        }
      }
    }

module.exports = {
    escapeRegExp: escapeRegExp
  , sortByRegExp: sortByRegExp
}
