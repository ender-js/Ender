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

// generic prototype, not intended to be actually used, helpful for `instanceof` though
function EnderError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  this.init('EnderError', message, cause)
}
EnderError.prototype = new Error()
EnderError.prototype.init = function (name, message, cause) {
  this.name = name
  this.message = message
  this.cause = cause
}
module.exports.EnderError = EnderError

// source-build.js
function BuildParseError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  this.init('BuildParseError', message, cause)
}
BuildParseError.prototype = new EnderError()
module.exports.BuildParseError = BuildParseError

// args-parse.js
function UnknownMainError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  this.init('UnknownMainError', message, cause)
}
UnknownMainError.prototype = new EnderError()
module.exports.UnknownMainError = UnknownMainError

// args-parse.js
function UnknownOptionError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  this.init('UnknownOptionError', message, cause)
}
UnknownOptionError.prototype = new EnderError()
module.exports.UnknownOptionError = UnknownOptionError

// repository.js
function RepositorySetupError (message, cause) {
  Error.call(this)
  Error.captureStackTrace(this, arguments.callee)
  this.init('RepositorySetupError', message, cause)
}
RepositorySetupError.prototype = new EnderError()
module.exports.RepositorySetupError = RepositorySetupError