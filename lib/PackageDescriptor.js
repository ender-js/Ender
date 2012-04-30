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
 * Wrapper for parsed package.json data. We use __defineGetter__ so you can't
 * change anything but it also allows us to override certain root properties
 * with properties contained within the "ender" object, where they exist.
 */

var overrides = 'ender name dependencies main'.split(' ')

  , PackageDescriptor = {
        init: function (json) {
          Object.keys(json).forEach(function(k) {
            this.__defineGetter__(k, overrides.indexOf(k) != -1
              ? function () {
                  return typeof json.ender == 'object' ? json.ender[k] : json[k]
                }
              : function () { return json[k] }
            )
          }.bind(this))
          return this
        }
    }

module.exports.create = function (json) {
  return Object.create(PackageDescriptor).init(json)
}