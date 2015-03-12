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

var fs              = require('fs')
  , sysUtil         = require('util')
  , tty             = require('tty')

  , argsParser      = require('./args-parser')

  , FilesystemError = require('./errors').FilesystemError
  , BuildParseError = require('./errors').BuildParseError


    // 'Packages:' is optional because it's not in <= 0.8.x Ender builds
  , buildInfoRegex  = /\n {2}\* Build: ender ([^\n]*)\s\S*(?:(?: {2}\* Packages: )([^\n]*))?/
  , defaultClientLib = 'ender-core'
  , defaultModuleLib = 'ender-commonjs'

  , getCorePackages = function (options) {
      var corePackages = []

      if (options['client-lib'] != 'none')
        corePackages.push(options['client-lib'] || defaultClientLib)

      if (options['module-lib'] != 'none')
        corePackages.push(options['module-lib'] || defaultModuleLib)

      return corePackages
    }

  , packageList = function (options) {
      var ids = options.packages && options.packages.length ? options.packages : [ '.' ]
      return getCorePackages(options).concat(ids)
    }

    // for --use <file>
  , getInputFilenameFromOptions = function (options) {
      return options.use ? options.use.replace(/(\.js)?$/, '.js') : 'ender.js'
    }

  , parseContext = function (file, callback) {
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

  , toKb = function (size) {
      size = Math.round(size / 1024 * 10) / 10
      return size + ' kB'
    }

  , styles = {
        'bold':      ['\033[1m', '\033[22m']
      , 'italic':    ['\033[3m', '\033[23m']
      , 'underline': ['\033[4m', '\033[24m']
      , 'inverse':   ['\033[7m', '\033[27m']
      , 'black':     ['\033[30m', '\033[39m']
      , 'red':       ['\033[31m', '\033[39m']
      , 'green':     ['\033[32m', '\033[39m']
      , 'yellow':    ['\033[33m', '\033[39m']
      , 'blue':      ['\033[34m', '\033[39m']
      , 'magenta':   ['\033[35m', '\033[39m']
      , 'cyan':      ['\033[36m', '\033[39m']
      , 'white':     ['\033[37m', '\033[39m']
      , 'default':   ['\033[39m', '\033[39m']
      , 'grey':      ['\033[90m', '\033[39m']
      , 'bgBlack':   ['\033[40m', '\033[49m']
      , 'bgRed':     ['\033[41m', '\033[49m']
      , 'bgGreen':   ['\033[42m', '\033[49m']
      , 'bgYellow':  ['\033[43m', '\033[49m']
      , 'bgBlue':    ['\033[44m', '\033[49m']
      , 'bgMagenta': ['\033[45m', '\033[49m']
      , 'bgCyan':    ['\033[46m', '\033[49m']
      , 'bgWhite':   ['\033[47m', '\033[49m']
      , 'bgDefault': ['\033[49m', '\033[49m']
    }

  , tagPattern = /\{([^}\s]+)\}([\S\s]*?)\{\/\1\}/g
  , renderTemplate = function (template) {
      return template.replace(tagPattern, function (all, tag, content) {
        content = renderTemplate(content)

        if (!(tag in styles)) return '{' + tag + '}' + content + '{/' + tag + '}'
        else if (tty.isatty(1)) return styles[tag][0] + content + styles[tag][1]
        else return content
      })
    }

  , defaultLogger = {
        info   : function (template) { console.log(renderTemplate(template)) }
      , warn   : function (template) { console.log(renderTemplate(template)) }
      , error  : function (template) { console.log(renderTemplate(template)) }
    }


module.exports = parseContext

module.exports = {
    getCorePackages              : getCorePackages
  , packageList                  : packageList
  , getInputFilenameFromOptions  : getInputFilenameFromOptions
  , parseContext                 : parseContext
  , toKb                         : toKb
  , defaultLogger                : defaultLogger
}
