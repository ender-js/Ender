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

var overrides = 'name main ender dependencies devDependencies'.split(' ')

  , isOverride = function (key) {
      return overrides.indexOf(key) > -1
    }

  , translate = function (json, newJson, key) {
      if (typeof newJson[key] != 'undefined') return

      if (isOverride(key)
          && typeof json.ender == 'object'
          && typeof json.ender[key] != 'undefined') {
        newJson[key] = json.ender[key]
      } else if (isOverride(key)
          && typeof json.overlay == 'object'
          && typeof json.overlay.ender == 'object'
          && typeof json.overlay.ender[key] != 'undefined') {
        newJson[key] = json.overlay.ender[key]
      } else {
        newJson[key] = json[key]
      }
    }

  , create = function (json) {
      var newJson = {}
        , _trans = translate.bind(null, json, newJson)

      Object.keys(json).forEach(_trans)
      if (typeof json.ender == 'object') {
        Object.keys(json.ender).forEach(_trans)
      }
      if (typeof json.overlay == 'object' && typeof json.overlay.ender == 'object') {
        Object.keys(json.overlay.ender).forEach(_trans)
      }

      return newJson
    }

module.exports.create = create