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

var xregexp    = require('xregexp')

  , repository = require('../repository')


  , defaultMax = 8

  , sortByRegExp = function (regex, array, ranked, priority) {
      var i = 0
        , j
        , m
        , p

      for (; i < priority.length; i++) {
        p = priority[i]
        for (j = 0; j < array.length; j++) {
          if (typeof array[j][p] == 'string' && regex.test(array[j][p])) {
            ranked.push(array.splice(j, 1)[0])
            j--
          } else if (array[j][p] && typeof array[j][p] != 'string') {
            for (m = 0; m < array[j][p].length; m++) {
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
      sortByRegExp(regexp, data, sorted, [ 'name' ])

      // args as phrase anywhere
      regexp = new RegExp('\\b' + args.join('\\s') + '\\b', 'i')
      sortByRegExp(regexp, data, sorted, priority)

      // args as keywords anywhere (ex: useful for case when express matches expresso)
      regexp = new RegExp('\\b' + args.join('\\b|\\b') + '\\b', 'i')
      sortByRegExp(regexp, data, sorted, priority)

      // we don't really care about relevance at this point :P
      return sorted.concat(data)
    }

  , processItem = function (log, item, terms) {
      var reg = new RegExp('(' + terms.map(function (item) {
            return xregexp.escape(item)
          }).join('|') + ')', 'ig')

        , maintainers = ''
        , title       = item.name
        , last

      if (item.description) title += ' - '
        + item.description.substring(0, 80)
        + (item.description.length > 80 ? '...' : '')


      log.info('+ ' + title.replace(reg, '{cyan}$1{/cyan}'))

      if (item.maintainers && item.maintainers.length) {
        item.maintainers = item.maintainers.map(function (maintainer) {
          return maintainer.replace(/^=/, '@')
        })

        if (item.maintainers.length > 1) {
          last        = item.maintainers.splice(-1)[0]
          maintainers = item.maintainers.join(', ')
          maintainers += ' & ' + last
        } else {
          maintainers = item.maintainers[0]
        }
      }

      log.info('  by ' + maintainers.replace(reg, '{cyan}$1{/cyan}') + '\n')
    }

  , handle = function (terms, max, log, callback, err, data) {
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
        log.info('{grey}Sorry, we couldn\'t find anything. :({/grey}')
        return callback()
      }

      if (primary.length) primary = rankRelevance(terms, primary)

      if (secondary.length && (max - primary.length > 0)) {
        relevance = rankRelevance(terms, secondary).slice(0, max - primary.length)
      }

      // let main-search-output handle this mess of data
      if (primary) {
        log.info('{yellow}Ender tagged results:{/yellow}')
        log.info(        '---------------------')

        primary.forEach(function (item) {
          processItem(log, item, terms)
        })
      }

      if (relevance) {
        var meta = secondary.length > relevance.length
                   ? relevance.length + ' of ' + secondary.length
                   : ''
        log.info('{yellow}NPM general results:{/yellow}' + (meta ? '{grey} (' + meta + '){/grey}' : ''))
        log.info(        '--------------------')

        relevance.forEach(function (item) {
          processItem(log, item, terms)
        })
      }

      callback()
    }

  , exec = function (options, log, callback) {
      var terms   = options.packages
        , max     = options.max || defaultMax
        , handler = handle.bind(null, terms, max, log, callback)

      if (arguments.length < 3) {
        callback = log
        log = undefined
      }

      if (!log) return callback()

      log.info('Searching NPM registry...')

      repository.setup(function (err) {
        if (err) return callback(err) // wrapped in repository.js
        repository.search(terms, handler)
      })
    }

module.exports.exec = exec
