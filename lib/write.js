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
 * A simple utility to write out the source files, both plain and minified.
 * The source comes from a SourceBuild object which has an asString() method
 * to pull together the component parts.
 */

var fs              = require('fs')
  , path            = require('path')
  , async           = require('async')
  , util            = require('./util')
  , FilesystemError = require('./errors').FilesystemError

  , writeFile = function (file, data, callback) {
      fs.writeFile(file, data, 'utf-8', function (err) {
        if (err) return callback(new FilesystemError(err))
        callback.apply(null, arguments)
      })
    }

  , write = function (options, sourceBuild, out, callback) {
        sourceBuild.asString({ type: 'plain' }, function(err, source) {
			var filename = util.getOutputFilenameFromOptions(options)
			var nonMinSource = source;
			
			writeFile(filename, source, function() {
				var filename = util.getOutputFilenameFromOptions(options).replace(/(\.min)?\.js/, '.min.js')
				sourceBuild.asString({ type: 'minified' }, function(err, source, sourceMapSeg2) {
					var sourcesMap = sourceBuild.sourcesMap;
					var offsetMap = {};
					
					for(var sourcePath in sourcesMap) {
						var relpath = path.relative('.', sourcePath);
						var start = nonMinSource.indexOf(sourcesMap[sourcePath]);
						var offset = nonMinSource.substr(0, start).split('\n').length - 1;
						offsetMap[relpath] = {offset: offset, lines: sourcesMap[sourcePath].split('\n').length};
					}
					
					var SourceMap = require('./sourcemap');
					var sm = new SourceMap(sourceMapSeg2);
					sm.translate(offsetMap);
					var sourceMap = sm.serialize();
					
					source += '//@ sourceMappingURL=ender.map.js'; // For demo purposes
					writeFile(filename, source, function() {
						writeFile('ender.map.js', sourceMap, callback);
					});
				})
			})
		})
    }

module.exports.write = write