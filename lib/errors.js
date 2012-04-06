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

// Ender Error Types
var errorTypes = [
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

// generic prototype, not intended to be actually used - helpful for `instanceof`
function EnderError (message, cause) {
  Error.captureStackTrace(this, arguments.callee)
  if (message || cause) this.init('EnderError', message, cause)
}

EnderError.prototype      = new Error()
EnderError.prototype.init = function (name, message, cause) {
  this.name    = name
  this.cause   = typeof message != 'string' ? message : cause
  this.message = typeof message != 'string' ? message.message : message
}

// full err list https://github.com/joyent/libuv/blob/master/include/uv.h
function getFilesystemErrorMessage (err) {
  switch (err.errno) {
    case 3 : return 'permission denied'
    case 9 : return 'bad file descriptor'
    case 10: return 'resource/file busy or locked'
    case 20: return 'too many files open'
    case 24: return 'file table overflow'
    case 25: return 'no buffer space available'
    case 26: return 'not enough memory'
    case 27: return 'not a directory'
    case 28: return 'illegal operation on a directory'
    case 34: return 'no such file or directory'
    case 47: return 'file already exists'
    case 49: return 'name too long'
    case 50: return 'operation not permitted'
    case 51: return 'too many symbolic links'
    case 53: return 'directory not empty'
    case 54: return 'no space left on device'
  }
  return err.message
}

function createFilesystemErrorMessage (err) {
  return getFilesystemErrorMessage(err) + (err.path ? ' [' + err.path + ']' : '')
}

// Ender error factory
function createError (name) {
  var err = function (message, cause) {
    if (typeof message == 'object') {
        cause          = message
        message        = createFilesystemErrorMessage(cause)
        this.code      = cause.code
        this.path      = cause.path
        this.errno     = cause.errno
        this.typeLabel = 'Filesystem Error'
    }
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
    this.init(name, message, cause)
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