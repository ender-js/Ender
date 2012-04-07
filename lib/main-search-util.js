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
 * Utility functions for the main-search module. Simple regex & sort stuff
 */

// given a regex, an array of objects and an array of properties prioritised, populate a ranked
// array with objects whose properties match the regex in priority order. elements get removed
// from source array when they are put into the priority array.
// array: [ { a: '1:, b: '2' }, { a: '3', b: '4' } ]
// ranked: [] (effective return)
// priority: [ 'a', 'b' ] (properties in 'array' elements)
var sortByRegExp = function (regex, array, ranked, priority) {
      var i = 0
        , j
        , m
        , p

      for (; i < priority.length; i++) {
        p = priority[i]
        for (j = 0; j < array.length; j++) {
          if (typeof array[j][p] == 'string' && regex.test(array[j][p])) {
            ranked.push(array.splice(j, 1)[0])
            j--
          } else if (array[j][p] && typeof array[j][p] != 'string') {
            for (m = 0; m < array[j][p].length; m++) {
              if (regex.test(array[j][p][m])) {
                ranked.push(array.splice(j, 1)[0])
                j--
                break
              }
            }
          }
        }
      }
    }

module.exports.sortByRegExp = sortByRegExp