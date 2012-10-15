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
 * Wrapper for parsed package.json data. Makes a copy of package.json but will
 * replace root properties where they are duplicated in an "ender" sub-object
 * or an "overlay->ender" sub-object (as per Packages/1.1)
 */

var overrides = {
      'name'            : 'name',
      'main'            : 'main',
      'bridge'          : 'ender',
      'dependencies'    : 'dependencies',
      'devDependencies' : 'devDependencies'
    }

  , create = function (json) {
      var newJson = Object.create(json) // original is available via Object.getPrototypeOf
        , key

      if (typeof json.overlay == 'object'
          && typeof json.overlay.ender == 'object') {
        for (key in overrides) {
          if (key in json.overlay.ender) {
            newJson[overrides[key]] = json.overlay.ender[key]
          }
        }
      }

      if (typeof json.ender == 'object') {
        for (key in overrides) {
          if (key in json.ender) {
            newJson[overrides[key]] = json.ender[key]
          }
        }
      }

      for (key in json) {
        if (!newJson.hasOwnProperty(key)) {
          newJson[key] = json[key]
        }
      }

      return newJson
    }

module.exports.create = create