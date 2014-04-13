/*global buildargs:true*/

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


var buster     = require('bustermove')
  , assert     = require('referee').assert
  , refute     = require('referee').refute
  , argsParser = require('../../lib/args-parser')


buster.testCase('toContextString', {
    'test no specials': function () {
      var actual = argsParser.toContextString(argsParser.parse('node /some/path/to/bin build fee fie foe fum'.split(' ')))
      assert.equals(actual, 'build fee fie foe fum')
    }

  , 'test "-" short form': function () {
      var ctx = argsParser.toContextString(argsParser.parse('node /som/path/to/bin build fee fie foe fum -o foobar -u yeehaw -s -h'.split(' ')))
      assert(ctx)
      assert.equals(ctx.split(' ').length, 11)
      ctx += ' ' // for convenience so we can match spaces around each element, even at the end
      assert.match(ctx, /^build fee fie foe fum /)
      assert.match(ctx, / --output foobar /)
      assert.match(ctx, / --use yeehaw /)
      assert.match(ctx, / --silent /)
      assert.match(ctx, / --help /)
    }

  , 'test array arg stops at next "-/--"': function () {
      // this test doesn't really need to be here but we may as well confirm
      var ctx = argsParser.toContextString(argsParser.parse('node /som/path/to/bin build fee fie --sandbox foo bar --output foobar foe fum'.split(' ')))
      assert.equals(ctx, 'build fee fie foe fum --sandbox foo bar --output foobar')
    }

  , 'test "--" long form': function () {
      var ctx = argsParser.toContextString(
            argsParser.parse((
                'node /some/path/to/bin build fee fie foe fum --output foobar --use yeehaw --max 10 ' +
                '--sandbox foo bar --silent --help --debug --externs what tha --client-lib BOOM --quiet --force-install'
            ).split(' ')))
      assert(ctx)
      assert.equals(ctx.split(' ').length, 24)
      ctx += ' ' // for convenience so we can match spaces around each element, even at the end
      assert.match(ctx, /^build fee fie foe fum /)
      assert.match(ctx, / --output foobar /)
      assert.match(ctx, / --use yeehaw /)
      assert.match(ctx, / --max 10 /)
      assert.match(ctx, / --sandbox foo bar /)
      assert.match(ctx, / --silent /)
      assert.match(ctx, / --help /)
      assert.match(ctx, / --debug /)
      assert.match(ctx, / --externs what tha /)
      assert.match(ctx, / --client-lib BOOM /)
      assert.match(ctx, / --quiet /)
      assert.match(ctx, / --force-install /)
    }
})