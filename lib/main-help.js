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
 * 'Help' executable module, what you get when you type `ender help [<cmd>]`.
 * The help documentation is stored in plain-text templates in the resources
 * directory and are passed through colors-tmpl to turn {red}red{/red} into
 * the same thing you'd get if you did 'red'.red with colors.js.
 * The default help file is 'main', you get this if you don't provide a 'cmd'
 * argument.
 */
var fs                = require('fs')
  , path              = require('path')
  , colorsTmpl        = require('colors-tmpl')
  , FilesystemError   = require('./errors').FilesystemError

  , templateDirectory = '../resources/help/'

    // page aliases
  , aliases = {
        'rm'  : 'remove'
      , 'ls'  : 'info'
      , 'list': 'info'
    }

  , exec = function (args, out, callback) {
      var page = args.packages[0] || 'main'
        , file

      page = page.toLowerCase().replace(/[^a-z]/g,'')
      page = aliases[page] || page
      file = path.join(__dirname, templateDirectory, page + '.tmpl')

      if (fs.existsSync(file)) {
        fs.readFile(file, 'utf-8', function (err, data) {
          if (err) return callback(new FilesystemError(err))
          out.showDocument(colorsTmpl.render(data))
          callback()
        })
      } else {
        out.noSuchCommand(args.packages[0])
        callback()
      }
    }

module.exports.exec = exec