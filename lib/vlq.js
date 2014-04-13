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

var VLQ_BITS = 5
  , VLQ_BASE = 1 << VLQ_BITS
  , VLQ_MASK = (1 << VLQ_BITS) - 1

  , itob64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('')
  , b64toi = {}  // This is initialized below

  , toVLQ = function (val) { return val < 0 ? (-val << 1) | 1 : (val << 1) }
  , fromVLQ = function (vlq) { return vlq & 1 ? -(vlq >>> 1) : (vlq >>> 1) }

  , encode = function (val) {
      var result = ''
        , vlq = toVLQ(val)
        , digit

      do {
        digit = vlq & VLQ_MASK      // Get the digit
        vlq >>>= VLQ_BITS           // Shift off the digit
        if (vlq) digit |= VLQ_BASE  // Set the continuation bit
        result += itob64[digit]
      } while (vlq > 0)

      return result
    }

  , decode = function (vlqstr) {
      var result = 0
        , digit
        , continuation
        , i

      for (i = 0, continuation = 1; continuation && i < vlqstr.length; i++) {
        digit = b64toi[vlqstr[i]]
        continuation = digit & VLQ_BASE    // Get the continuation bit
        digit &= VLQ_MASK                  // Mask off the continuation bit
        result += digit << (VLQ_BITS * i)  // Add the digit to the result
      }

      if (continuation && i == vlqstr.length) return NaN
      return { value: fromVLQ(result), rest: vlqstr.slice(i) }
    }

itob64.forEach(function(v, i) {
	b64toi[v] = i;
})


module.exports = {
    encode: encode
  , decode: decode
}
