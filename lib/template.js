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
 * An interface to the EJS template system. Note that we're not tied to EJS,
 * if someone has a better idea that can handle whitespace better then it can
 * be changed here (it was Handlebars initially but that was even crappier).
 * Beware though, the tests are *very* prescriptive about whitespace, you have
 * to get it exactly right (newlines, whitespace).
 */

var fs = require('fs')
  , path = require('path')
  , ejs = require('ejs')

    // cached for the duration of the app
  , templates = {}
  , readCallbacks = {}

    // note that we collect callbacks and trigger them only once per template
    // render so we don't have to read the same file multiple times.
  , render = function (templateString, callbackData) {
      callbackData.forEach(function (cbd) {
        cbd.callback(null, ejs.render(templateString, cbd.data))
      })
    }

  , generateSource = function (key, file, data, callback) {
      var cbd = { callback: callback, data: data }
      if (!templates[key]) { // is cached?
        if (readCallbacks[key]) {
          readCallbacks[key].push(cbd)
        } else {
          readCallbacks[key] = [ cbd ]
          fs.readFile(path.resolve(__dirname, file), 'utf-8', function (err, templateContents) {
            if (err)
              return callback(err)

            // this bit of fluff does some simple reformatting of our text so we can write our templates
            // a bit nicer and not cram them up so much.
            templates[key] = templateContents
              .replace(/^[\t ]+<%/gm, '<%')
              .replace(/\s*\\\n/g, '')
              .replace(/(^<%[^%]+%>)\n/gm, '$1')
            render(templates[key], readCallbacks[key])
            ;delete readCallbacks[key]
          })
        }
      } else
        render(templates[key], [ cbd ])
    }

module.exports.generateSource = generateSource