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
  , npm             = require('npm')
  , os              = require('os')
  , path            = require('path')

  , FilesystemError = require('../../errors').FilesystemError


  , generateTempFile = function () {
      this._sessionFile = path.join(os.tmpDir(), 'ender_npm_' + process.pid + '.' + (+new Date()))
      return fs.createWriteStream(this._sessionFile, {flags: 'w', mode: '0644'})
    }

  , setup = function (callback) {
      if (this._isSetup) return callback()

      var streamError = false

      try {
        this._sessionStream = generateTempFile.call(this)
      } catch (err) {
        return callback(new FilesystemError(err))
      }

      this._sessionStream.on('error', function(err) {
        callback(new FilesystemError(err))
        streamError = true
      })

      // streams are the safest way to deal with npm, actual fds are now unreliable
      // and since we have no real way to tell when npm is finished (the callbacks
      // are triggered before it does its own cleanup) the best we can do is a
      // destroySoon() on our stream.
      var config = {
            logstream : this._sessionStream
          , outfd     : this._sessionStream
        }

      fs.mkdir('node_modules', (0777 & ~process.umask()), function (err) {
        if (err && err.code != 'EEXIST') return callback(new FilesystemError(err))

        npm.load(config, function (err) {
          if (!err && !streamError) this._isSetup = true
          callback.apply(null, arguments)
        }.bind(this))
      }.bind(this))
    }

module.exports = setup
