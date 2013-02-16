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
 * a utility to partially read an ender build file and parse the head comment
 * to pull out the 'Build:' and 'Packages:' lines. Returns the build command as a properly
 * parsed options object (via argsParser).
 */

const fs              = require('fs')
    , argsParser      = require('ender-args-parser')
    , FilesystemError = require('./errors').FilesystemError
    , BuildParseError = require('./errors').BuildParseError

    // 'Packages:' is optional because it's not in <= 0.8.x Ender builds
    , buildInfoRegex  = /\n {2}\* Build: ender ([^\n]*)\s\S*(?:(?: {2}\* Packages: )([^\n]*))?/

var parseContext = function (file, callback) {
      fs.open(file, 'r', function (err, fd) {
        if (err) return callback(new FilesystemError(err))

        var buffer = new Buffer(2048)
        fs.read(fd, buffer, 0, 2048, null, function (err, bytesRead, buffer) {
          if (err) return callback(new FilesystemError(err))

          fs.close(fd, function () {
            // err? who cares, we have our data, let's use it and run for the hills!
            var options
              , error
              , match = String(buffer).match(buildInfoRegex)

            if (!match) {
              error = 'Could not parse ender spec from "' + file + '" (not an Ender build file?)'
              return callback(new BuildParseError(error))
            }

            try {
              options = argsParser.parseClean(match[1].split(' '))
            } catch (ex) {
              error = 'Could not parse ender spec from "' + file + '"'
              return callback(new BuildParseError(error, ex))
            }

            callback(null, {
                options  : options
              , packages : match[2] && match[2].split(' ')
            })
          })
        })
      })
    }

module.exports = parseContext