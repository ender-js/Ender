var ENDER = {
  npm: require('./ender.npm')
, search: module.exports
}

module.exports = function (terms, options) {
  ENDER.npm.search(terms, function (data) {
    var primary = []
      , secondary = []
      , secLength
      , results
      , which
      , meta
      , k
      , i

    for (i in data) {
      if (k = data[i].keywords) {
        which = secondary
        for (var j = k.length; j--;) {
          if (k[j] == 'ender') {
            which = primary
            break
          }
        }
        which.push(data[i])
      }
    }

    //white spacceee
    console.log(' ')

    if (!primary.length && !secondary.length) {
      return console.log('sorry, we couldn\'t find anything. :('.yellow)
    }

    if (primary.length) {
      console.log('Ender tagged results:'.yellow)
      console.log('---------------------')
      primary = rankRelevance(terms, primary)
      primary.forEach(function (item) {
        processItem(item, terms)
      })
    }

    if (secondary.length) {
      secLength = (options.max || 8) - primary.length
      if (secLength > 0) {
        secondary = rankRelevance(terms, secondary)
        meta = secondary.length > secLength ? ' (' + secLength + ' of ' + secondary.length  + ')' : ''
        console.log('NPM general results:'.yellow + meta.grey)
        console.log('--------------------\n')
        secondary.slice(0, secLength).forEach(function (item) {
          processItem(item, terms)
        })
      }
    }
  })
}

function rankRelevance(args, data) {
  var sorted = []
    , priority = ['name', 'keywords', 'description']
    , args = args.map(function (arg) {  return escapeRegExp(arg) })
    , regex

  // args as exact phrase for name
  regexp = new RegExp("^" + args.join("\\s") + "$")
  sortByRegExp(regexp, data, sorted, ["name"])

  // args as phrase anywhere
  regexp = new RegExp("\\b" + args.join("\\s") + "\\b", "i")
  sortByRegExp(regexp, data, sorted, priority)

  // args as keywords anywhere (ex: useful for case when express matches expresso)
  regexp = new RegExp("\\b" + args.join("\\b\|\\b") + "\\b", "i")
  sortByRegExp(regexp, data, sorted, priority)

  // we don't really care about relevance at this point :P
  return sorted.concat(data)
}

function sortByRegExp(regex, array, ranked, priority) {
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

function processItem(item, terms) {
  var reg = new RegExp('(' + terms.map(function (item) { return escapeRegExp(item) }).join('|') + ')', 'ig')
    , maintainers = ''
    , title = item.name
    , dots
    , last

  if (item.description) {
    dots = item.description.length > 80 ? '...' : ''
    title += ' - ' + item.description.substring(0, 80) + dots
  }

  console.log('+ ' + title.replace(reg, '$1'.cyan))

  if (item.maintainers && item.maintainers.length) {
    item.maintainers = item.maintainers.map(function (maintainer) {
      return maintainer.replace(/^=/, '@')
    })

    if (item.maintainers.length > 1) {
      last = item.maintainers.splice(-1)[0]
      maintainers = item.maintainers.join(', ')
      maintainers += ' & ' + last
    } else {
      maintainers = item.maintainers[0]
    }

  }

  console.log('  by ' + maintainers.replace(reg, '$1'.cyan) + '\n')
}

function escapeRegExp(string){
  // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
  return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function (match) {
	  return '\\' + match
	})
}