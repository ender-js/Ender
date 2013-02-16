/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/******************************************************************************
 * 'Search' executable module for the `ender search <keyword> [--max <int>]`.
 * The reason this is non-trivial is because we take the npm.commands.search()
 * results, sort them so that the modules with 'ender' as a keyword are shown
 * first and also only show 'max' results.
 */

var repository = require('ender-repository')
  , xregexp    = require('xregexp')
  , searchUtil = require('./main-search-util')
  , defaultMax = 8

    // rank libs according to the keywords requested, those with the keyword(s)
    // in the name go to the top, then those with the keyword(s) in their
    // 'keywords' list go next, lastly those with the keyword(s) in their
    // 'description' string.
  , rankRelevance = function (args, data) {
      var sorted   = []
        , priority = [ 'name', 'keywords', 'description' ]
        , args     = args.map(function (arg) {  return xregexp.XRegExp.escape(arg) })
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
      var primary   = []
        , secondary = []
        , relevance = null

      repository.packup(err)

      if (err) return callback(err) // wrapped in repository.js

      if (data) {
        Object.keys(data).forEach(function (id) {
          var d = data[id]
          if (d.keywords) (d.keywords.indexOf('ender') == -1 ? secondary : primary).push(d)
        })
      }

      if (!primary.length && !secondary.length) {
        out && out.searchNoResults()
        return callback()
      }

      if (primary.length) primary = rankRelevance(terms, primary)

      if (secondary.length && (max - primary.length > 0)) {
        relevance = rankRelevance(terms, secondary).slice(0, max - primary.length)
      }

      // let main-search-output handle this mess of data
      out && out.searchResults({
          terms          : terms
        , max            : max
        , primary        : primary.length ? primary : null
        , secondary      : relevance
        , secondaryTotal : secondary.length
      })

      callback()
    }

  , exec = function (args, out, callback) {
      var terms   = args.packages
        , max     = args.max || defaultMax
        , handler = handle.bind(null, terms, max, out, callback)

      out && out.searchInit()

      repository.setup(function (err) {
        if (err) return callback(err) // wrapped in repository.js
        repository.search(terms, handler)
      })
    }

module.exports.exec = exec