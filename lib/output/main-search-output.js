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

var xregexp = require('xregexp').XRegExp
  , extend  = require('util')._extend
  , Output  = require('./output')

  , SearchOutput = extend({

        searchInit: function () {
          this.statusMsg('Searching NPM registry...')
          this.log()
        }

      , searchNoResults: function () {
          this.warnMsg('Sorry, we couldn\'t find anything. :(')
        }

      , searchResults: function (results) {
          if (results.primary) {
            this.heading('Ender tagged results:')
            results.primary.forEach(function (item) {
              this.processItem(item, results.terms)
            }.bind(this))
          }

          if (results.secondary) {
            var meta = results.secondaryTotal > results.secondary.length
              ? results.secondary.length + ' of ' + results.secondaryTotal
              : ''
            this.heading('NPM general results:', meta)
            results.secondary.forEach(function (item) {
              this.processItem(item, results.terms)
            }.bind(this))
          }
        }

      , processItem: function (item, terms) {
          var reg = new RegExp('(' + terms.map(function (item) {
                return xregexp.escape(item)
              }).join('|') + ')', 'ig')

            , maintainers = ''
            , title       = item.name
            , last

          if (item.description) title += ' - '
            + item.description.substring(0, 80)
            + (item.description.length > 80 ? '...' : '')

          this.log('+ ' + title.replace(reg, '$1'.cyan))

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

          this.log('  by ' + maintainers.replace(reg, '$1'.cyan) + '\n')
        }

      , create: function (out, debug, quiet) {
          return Object.create(this).init(out, debug, quiet)
        }

    }, Output) // inherit from Output

module.exports = SearchOutput
