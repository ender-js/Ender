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
 * A collection of custom errors to return where we know the cause of the error
 * and can tell the user about it. Any error that is returned that isn't an
 * instance of EnderError has an unknown cause (the aim should be to wrap
 * everything in an EnderError type so we can explain the errors better).
 */

var errno = require('errno')

    // Ender Error Types
  , errorTypes = [
        'BuildParseError'
      , 'UnknownMainError'
      , 'UnknownOptionError'
      , 'RepositorySetupError'
      , 'RepositoryCommandError'
      , 'JSONParseError'
      , 'ChildProcessError'
      , 'CompressionError'
      , 'MinifyError'
      , 'FilesystemError'
    ]

function init (name, message, cause) {
  this.name      = name
  // can be passed just a 'cause'
  this.cause     = typeof message != 'string' ? message : cause
  this.message   = typeof message != 'string' ? message.message : message
}

// generic prototype, not intended to be actually used - helpful for `instanceof`
function EnderError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  if (message || cause) init.call(this, 'EnderError', message, cause)
}

EnderError.prototype = new Error()

// Ender error factory
function createError (name) {
  var err = function (message, cause) {
    init.call(this, name, message, cause)
    if (name == 'FilesystemError') {
      this.code    = this.cause.code
      this.path    = this.cause.path
      this.errno   = this.cause.errno
      this.message =
        (errno.errno[this.cause.errno]
          ? errno.errno[this.cause.errno].description
          : this.cause.message)
        + (this.cause.path ? ' [' + this.cause.path + ']' : '')
    }
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
  }
  err.prototype = new EnderError()
  return err
}

// export generic Ender Error
module.exports.EnderError = EnderError

// export error types
errorTypes.forEach(function (type) {
  module.exports[type] = createError(type)
})