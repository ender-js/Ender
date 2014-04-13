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

var fs     = require('fs')
  , path   = require('path')

  , FilesystemError = require('../../errors').FilesystemError


  , tarballRegExp = /.tgz$/
  , pathRegExp = /^(\.|\/|\w:\\)/
  , gitRegExp = /^git(\+(ssh|https?))?:/
  , urlRegExp = /^https?:/
  , gitHubRegExp = /\//

  , getName    = function (id) { return id.split('@')[0] }
  , getVersion = function (id) { return id.split('@')[1] || ''}

  , isTarball = function (name) { return pathRegExp.test(name) && tarballRegExp.test(name) }
  , isUrl     = function (name) { return urlRegExp.test(name) }
  , isPath    = function (name) { return pathRegExp.test(name) }
  , isGit     = function (name) { return gitRegExp.test(name) }
  , isGitHub  = function (name) { return gitHubRegExp.test(name) }

  , getNameType = function (name) {
      return (
          isTarball(name) ? 'tarball'
        : isUrl(name)     ? 'url'
        : isPath(name)    ? 'path'
        : isGit(name)     ? 'git'
        : isGitHub(name)  ? 'github'
        : 'package'
      )
    }

  , normalizeName = function (name, parentRoot) {
      switch (getNameType(name)) {
        case 'path'   : return path.resolve(parentRoot || '.', name)
        case 'github' : return 'git://github.com/' + name
        default       : return name
      }
    }

  , getChildRoot = function (name, parentRoot) {
      return path.resolve(parentRoot || '.', 'node_modules', name)
    }

  , getPackageDescriptor = function (root) {
      return path.join(root, 'package.json')
    }


module.exports = {
    getName              : getName
  , getVersion           : getVersion
  , getNameType          : getNameType
  , normalizeName        : normalizeName
  , getChildRoot         : getChildRoot
  , getPackageDescriptor : getPackageDescriptor
}
