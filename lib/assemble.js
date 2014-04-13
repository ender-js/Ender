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
 * An interface to UglifyJS. Preserves copyright comments, which UglifyJS
 * currently doesn't do: https://github.com/mishoo/UglifyJS/issues/85
 */

var async         = require('async')
  , fs            = require('fs')
  , mu            = require('mu2')
  , path          = require('path')

  , argsParser    = require('./args-parser')
  , vlq           = require('./vlq')

  , TemplateError = require('./errors').TemplateError


  , generateDefaultBridge = function (name) {
      return (
          "m = require('" + name + "');\n"
        + "if (typeof(m) == 'function') $.ender({'" + name + "':m});\n"
        + "$.ender(m);\n"
      )
    }

  , indentLines = function (str, spaces) {
      return str && str.replace(/^/mg, Array(spaces+1).join(' '))
    }

  , assemble = function (buildName, sourceMapName, options, packages, callback) {
      var templateData = {
              buildName: buildName
            , sourceMapName: sourceMapName
            , context: argsParser.toContextString(options)
            , packageList: []
            , packages: []
          }

        , sourceIndex = 0
        , sourceLine = 0
        , sourceNames = []
        , generateMappings = function (name, content, indent, inline) {
            if (sourceNames.indexOf(name) == -1) sourceNames.push(name)

            return content.replace(/^.*$(\r\n|\r|\n)?/mg, function (line, ending, offset) {
              var firstLine = !offset
                , sourceIndexDelta = (firstLine ? sourceNames.indexOf(name) - sourceIndex : 0)
                , sourceLineDelta = (firstLine ? -sourceLine : 1)

              if (!line.length) return ''

              sourceIndex += sourceIndexDelta
              sourceLine += sourceLineDelta

              return (
                vlq.encode(indent || 0) +                                     // Adjust for indent
                vlq.encode(sourceIndexDelta) +                                // Set the source index
                vlq.encode(sourceLineDelta) +                                 // Set the source line
                vlq.encode(0) +                                               // Source column (always 0)
                (ending ? ';' : '')                                           // Did we have a line ending?
              )
            })
          }

      packages.forEach(function (pkg) {
        templateData.packageList.push(pkg.id)

        // are we autointegrating this package?
        if (!pkg.bridge && Array.isArray(options.integrate) && options.integrate.indexOf(pkg.name) != -1) {
          pkg.sources.push({ name: 'bridge', content: generateDefaultBridge(pkg.name) })
          pkg.bridge = 'bridge'
        }

        if (pkg.sources.length) {
          var pkgData = {
                  isBare: pkg.bare
                , isExposed: pkg.bare

                , name: pkg.name
                , main: pkg.main
                , bridge: pkg.bridge
                , sources: []
              }

            , relativeRoot = path.relative('.', pkg.root)

          // do we have a sandboxed build?
          if (Array.isArray(options.sandbox)) {
            pkgData.isExposed = (options.sandbox.indexOf(pkg.name) != -1)
          }

          pkg.sources.forEach(function (source, i) {
            var indent = pkg.bare ? 2 : 6
              , indentedContent = indentLines(source.content, indent)

            // check if this is the bridge and we want to exclude it from the build
            if (pkg.bare && !pkgData.isExposed && source.name == pkg.bridge) {
              delete pkgData.bridge
              return
            }

            pkgData.sources.push({
                i: i
              , name: source.name
              , content: indentedContent
              , mappings: generateMappings(path.join(relativeRoot, source.name + '.js'), source.content, indent)
            })
          })

          templateData.packages.push(pkgData)
        }
      })

      templateData.packageList = templateData.packageList.join(' ')
      templateData.sourceList = JSON.stringify(sourceNames)

      async.parallel({
          build: function (callback) {
            var source = ''
            mu.compileAndRender('build.mustache', templateData)
              .on('error', function (err) { callback(new TemplateError(err)) })
              .on('data', function (data) { source += data })
              .on('end', function () { callback(null, source) })
          }

        , sourceMap: function (callback) {
            var sourceMap = ''
            mu.compileAndRender('build.map.mustache', templateData)
              .on('error', function (err) { callback(new TemplateError(err)) })
              .on('data', function (data) { sourceMap += data })
              .on('end', function () { callback(null, sourceMap) })
          }
      }, callback)
    }

mu.root = path.resolve(__dirname, '..', 'resources', 'assemble')

module.exports = {
    assemble: assemble
}
