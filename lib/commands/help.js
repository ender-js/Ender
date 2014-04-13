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


var fs                = require('fs')
  , path              = require('path')

  , FilesystemError   = require('../errors').FilesystemError


  , templateDirectory = path.resolve(__dirname, '..', '..', 'resources', 'help')

    // page aliases
  , aliases = {
        'rm'  : 'remove'
      , 'ls'  : 'info'
      , 'list': 'info'
    }

  , exec = function (options, log, callback) {
      var page = options.packages[0] || 'main'
        , file

      if (arguments.length < 3) {
        callback = log
        log = undefined
      }

      if (!log) return callback()

      page = page.toLowerCase().replace(/[^a-z]/g,'')
      page = aliases[page] || page
      file = path.join(templateDirectory, page + '.tmpl')

      fs.exists(file, function (exists) {
        if (exists) {
          fs.readFile(file, 'utf-8', function (err, template) {
            if (err) return callback(new FilesystemError(err))
            log.info(template)
            callback()
          })
        } else {
          log.warn('No such command: {yellow}' + page + '{/yellow}\n' +
                   'Use {cyan}ender help{/cyan} to show a summary of basic commands')

          callback()
        }
      })
    }

module.exports.exec = exec
