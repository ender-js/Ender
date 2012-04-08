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
 * Our own argument-parser. It's unfortunate that we have to do this but
 * the argument structure of Ender rules out most other argument parser
 * modules. Specifically the fact that --sandbox can have multiple arguments
 * to it, normally you'd only have one per --/-.
 * See the tests for this for a more comprehensive treatment of what we expect
 * from this code.
 */

var UnknownMainError   = require('./errors').UnknownMainError
  , UnknownOptionError = require('./errors').UnknownOptionError

    // the default array option to collect arguments for ('packages'), so all non
    // --/- prefixed arguments will be sent to this list until we receive a --/-
    // that is an 'Array' type.
    // e.g. `ender build foo bar baz`, our 'main' is 'build', 'foo bar baz' are
    // all collected into 'packages'. Whereas `ender build foo bar --sandbox foo baz`
    // we get 'foo bar' in packages and 'foo baz' in 'sandbox'.
  , defaultArray

    // available options
  , options = (function () {
      var arr = []
        , add = function (name, short, type, altMain) {
            var o

            if (typeof short != 'string') {
              altMain = type
              type    = short
              short   = null
            }

            o = {
                name    : name
              , short   : short
              , type    : type
              , altMain : altMain
            }

            if (short === '' && type === Array) defaultArray = name
            arr.push(o)
          }

      //   --foo       -f    [type]
      add('packages' , ''  , Array)
      add('output'   , 'o' , String)
      add('use'      , 'u' , String)
      add('max'            , Number)
      add('sandbox'        , Array)
      add('noop'     , 'x' , Boolean)
      add('silent'   , 's' , Boolean)
      add('help'     , 'h' , Boolean, true)
      add('sans'           , Boolean)
      add('debug'          , Boolean)
      add('version'  , 'v' , Boolean, true)
      add('externs'        , Array)

      return arr
    }())

    // allowable first-arguments that resolve to our main-X.js modules.
  , mains = {
        'help'    : 'help'
      , 'build'   : 'build'
      , 'add'     : 'add'
      , 'set'     : 'add'
      , 'refresh' : 'add'
      , 'remove'  : 'remove'
      , 'rm'      : 'remove'
      , 'info'    : 'info'
      , 'ls'      : 'info'
      , 'list'    : 'info'
      , 'search'  : 'search'
      , 'compile' : 'compile'
      , 'version' : 'version'
    }

  , findOption = function (s) {
      var i
        , option
        , match = s.match(/^(--?)(\w+)$/)

      if (!match) return

      for (i = 0; i < options.length; i++) {
        var hasOption

        option    = options[i]
        hasOption = (match[1] === '--' && match[2] === option.name)
          || (match[1] === '-' && option.short && match[2] === option.short)

        if (hasOption) return option
      }
      throw new UnknownOptionError('Unknown option "' + s + '"')
    }

    // reverse a parse! Turn an `options` object into a parsable commandline string
    // mainly so we can include it in the 'Build:' string in the source header but
    // it has other uses.
  , toContextString = function (options) {
      var str = options.main
        , p

      if (options.packages.length) str += ' ' + options.packages.join(' ')

      for (p in options) {
        if (p === 'packages' || p === 'main') continue
        str += ' --' + p
        if (Array.isArray(options[p])) str += ' ' + options[p].join(' ')
        else if (typeof options[p] !== 'boolean') str += ' ' + options[p]
      }
      return str
    }

  , parse = function (argv, slice, options) {
      var args = Array.prototype.slice.call(argv, slice) // slice might be 0 for clean or 2 for raw
        , options = options || { main: 'help' }
        , currentArray
        , arg
        , o
        , setCurrentArray = function (name) {
            currentArray = name
            options[currentArray] = options[currentArray]
              ? Array.prototype.slice.call(options[currentArray], 0) // clone
              : []
          }

      setCurrentArray(defaultArray)

      while (arg = args.shift()) {
        o = findOption(arg)
        if (o) {
          currentArray = defaultArray

          if (o.type === Boolean) {
            options[o.name] = true
            if (o.altMain && !options.main) options.main = o.name
          } else if ((o.type === String || o.type === Number) && args.length) {
            // converstion through type constructor
            options[o.name] = o.type(args.shift())
          } else if (o.type === Array) {
            setCurrentArray(o.name)
          }

        } else if (!options.main) {
          options.main = arg
        } else {
          options[currentArray].push(arg)
        }
      }

      if (!options.main) throw new UnknownMainError('No main command supplied')
      if (!mains[options.main]) throw new UnknownMainError('Unknown main command "' + options.main + '"')
      options.main = mains[options.main]

      return options
    }

    // merge two options objects together, for `add` and `remove`.
  , extend = function (originalArgs, newArgs) {
      return parse(toContextString(newArgs).split(' '), 1, originalArgs)
    }

module.exports = {
    parse           : function (argv) { return parse(argv, 2) } // with 2 additional args 'node script.js'
  , parseClean      : function (argv) { return parse(argv, 0) } // without
  , extend          : extend
  , toContextString : toContextString
}
