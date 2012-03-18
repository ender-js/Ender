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