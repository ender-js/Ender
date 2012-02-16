var fs = require('fs')
  , path = require('path')

// thanks to NPM for these two, where is our process.tempDir NodeJS?
var tmpDir = process.env.TMPDIR
    || process.env.TMP
    || process.env.TEMP
    || (process.platform === "win32" ? "c:\\windows\\temp" : "/tmp")

  , homeDir = process.platform === "win32"
    ? process.env.USERPROFILE
    : process.env.HOME

  , extend = function (src, dst) {
      Object.getOwnPropertyNames(src).forEach(function (prop) {
        if (!(prop in dst))
          Object.defineProperty(dst, prop, Object.getOwnPropertyDescriptor(src, prop))
      })
      return dst
    }

  , mkdir = function (dir, callback) {
      path.exists(dir, function (exists) {
        if (exists)
          callback()
        else
          fs.mkdir(dir, callback)
      })
    }

module.exports = {
    tmpDir: tmpDir
  , homeDir: homeDir
  , extend: extend
  , mkdir: mkdir
}
