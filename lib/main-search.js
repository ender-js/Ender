var repository = require('./repository')
  , escapeRegExp = require('./main-search-util').escapeRegExp
  , searchUtil = require('./main-search-util')
  , defaultMax = 8

  , exec = function (args, out, callback) {
      var terms = args.remaining
        , max = args.max || defaultMax
        , handler = handle.bind(null, terms, max, out, callback)

      out && out.searchInit()

      repository.setup(function (err) {
        if (err) {
          out && out.repositoryLoadError(err)
          return callback && callback(err)
        }

        repository.search(terms, handler)
      })
    }

  , handle = function (terms, max, out, callback, err, data) {
      var primary = []
        , secondary = []

      repository.packup(err)

      if (err) {
        out && out.searchError(err)
        return callback && callback(err)
      }

      if (data) {
        Object.keys(data).forEach(function (id) {
          var d = data[id]
          if (d.keywords)
            (d.keywords.indexOf('ender') == -1 ? secondary : primary).push(d)
        })
      }

      if (!primary.length && !secondary.length) {
        out && out.searchNoResults()
        return callback && callback()
      }

      if (primary.length)
        primary = rankRelevance(terms, primary)

      out && out.searchResults({
          terms: terms
        , max: max
        , primary: primary.length ? primary : null
        , secondaryTotal: secondary.length
        , secondary: secondary.length && (max - primary.length > 0)
            ? rankRelevance(terms, secondary).slice(0, max - primary.length)
            : null
      })

      callback && callback()
    }

  , rankRelevance = function (args, data) {
      var sorted = []
        , priority = [ 'name', 'keywords', 'description' ]
        , args = args.map(function (arg) {  return escapeRegExp(arg) })
        , regex

      // args as exact phrase for name
      regexp = new RegExp('^' + args.join('\\s') + '$')
      searchUtil.sortByRegExp(regexp, data, sorted, [ 'name' ])

      // args as phrase anywhere
      regexp = new RegExp('\\b' + args.join('\\s') + '\\b', 'i')
      searchUtil.sortByRegExp(regexp, data, sorted, priority)

      // args as keywords anywhere (ex: useful for case when express matches expresso)
      regexp = new RegExp('\\b' + args.join('\\b\|\\b') + '\\b', 'i')
      searchUtil.sortByRegExp(regexp, data, sorted, priority)

      // we don't really care about relevance at this point :P
      return sorted.concat(data)
    }

module.exports.exec = exec
