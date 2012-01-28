var extend = require('./util').extend
  , searchUtil = require('./main-search-util')
  , Output = require('./output')

  , SearchOutput = extend(Output, { // inherit from Output

        test: function () {
          console.log('test', this.outfd, this.debug)
        }

      , searchInit: function () {
          this.statusMsg('Searching NPM registry...')
          this.log()
        }

      , searchNoResults: function () {
          this.warnMsg('Sorry, we couldn\'t find anything. :(')
        }

      , searchError: function (err) {
          this.repositoryError(err, 'Something went wrong searching NPM')
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
                  return searchUtil.escapeRegExp(item)
                }).join('|') + ')', 'ig')
            , maintainers = ''
            , title = item.name
            , last

          if (item.description)
            title += ' - ' + item.description.substring(0, 80) + (item.description.length > 80 ? '...' : '')

          this.log('+ ' + title.replace(reg, '$1'.cyan))

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

          this.log('  by ' + maintainers.replace(reg, '$1'.cyan) + '\n')
        }

      , create: function (outfd, debug) {
          return Object.create(this).init(outfd, debug)
        }

    })

module.exports = SearchOutput
