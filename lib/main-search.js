/******************************************************************************
 * 'Search' executable module for the `ender search <keyword> [--max <int>]`.
 * The reason this is non-trivial is because we take the npm.commands.search()
 * results, sort them so that the modules with 'ender' as a keyword are shown
 * first and also only show 'max' results.
 */

var repository = require('./repository')
  , escapeRegExp = require('./main-search-util').escapeRegExp
  , searchUtil = require('./main-search-util')
  , defaultMax = 8

    // rank libs according to the keywords requested, those with the keyword(s)
    // in the name go to the top, then those with the keyword(s) in their
    // 'keywords' list go next, lastly those with the keyword(s) in their
    // 'description' string.
  , rankRelevance = function (args, data) {
      var sorted = []
        , priority = [ 'name', 'keywords', 'description' ]
        , args = args.map(function (arg) {  return escapeRegExp(arg) })
        , regexp

      // args as exact phrase for name
      regexp = new RegExp('^' + args.join('\\s') + '$')
      searchUtil.sortByRegExp(regexp, data, sorted, [ 'name' ])

      // args as phrase anywhere
      regexp = new RegExp('\\b' + args.join('\\s') + '\\b', 'i')
      searchUtil.sortByRegExp(regexp, data, sorted, priority)

      // args as keywords anywhere (ex: useful for case when express matches expresso)
      regexp = new RegExp('\\b' + args.join('\\b|\\b') + '\\b', 'i')
      searchUtil.sortByRegExp(regexp, data, sorted, priority)

      // we don't really care about relevance at this point :P
      return sorted.concat(data)
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

      // let main-search-output handle this mess of data
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

  , exec = function (args, out, callback) {
      var terms = args.packages
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

module.exports.exec = exec