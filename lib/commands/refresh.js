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
 * 'Refresh' executable module, for `ender refresh [--use <file>]`.
 * This module first parses the build command in the ender.js file in CWD or
 * the file or the file provided on the --use option.
 * The build command from the ender.js build is then passed to the Build
 * module which does all the hard work.
 */

var util         = require('../util')
  , build        = require('./build')


  , exec = function (options, log, callback) {
      var filename = util.getInputFilenameFromOptions(options)
    ; delete options.use // don't want --use showing up in the 'Build:' context string
      util.parseContext(filename, function (err, context) {
        if (err) return callback(err)

        // set --force-install but don't leave a trace in the 'Build:' context string
        context.options['_force-install'] = true
        build.exec(context.options, log, callback)
      })
    }

module.exports.exec = exec
