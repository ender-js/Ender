var zlib = require('zlib')
  , fs = require('fs')
  , async = require('async')
  , minify = require('./minify')
  , SourceBuild = require('./source-build')
  , mainBuildUtil = require('./main-build-util')

  , sizes = function (filename, callback) {
      var sizes = {}
        , mkcb = function (prop, callback) {
            return function (err, data) {
              if (err)
                return callback(err)
              sizes[prop] = data.length
              callback(null, data)
            }
          }

      async.waterfall(
          [
              function (callback) {
                fs.readFile(filename, 'utf-8', mkcb('raw', callback))
              }
            , function (data, callback) {
                minify.minify(data, mkcb('minify', callback))
              }
            , function (data, callback) {
                zlib.gzip(data, mkcb('gzip', callback))
              }
          ]
        , function (err) {
            callback(err, sizes)
          }
      )
    }

  , parseContext = function (filename, callback) {
      SourceBuild.parseContext(filename, function (err, options, packages) {
        if (err)
          return callback(err)

        callback(null, {
            options: options
          , packages: packages
        })
      })
    }

  , buildArchyTree = function (packages, tree) {
      var archyTree = { label: 'Active packages:', nodes: [] }
        , localPackages = mainBuildUtil.localizePackageList(packages, tree)

      mainBuildUtil.forEachOrderedDependency(localPackages, tree, function (packageName, parents, data, index, first) {
        var archyTreeNode = archyTree
          , found, newNode, regexp, label

        parents = parents.concat([ packageName ])
        for (var i = 0; i < parents.length; i++) {
          found = false
          regexp = new RegExp('^(.\\[\\d\\dm)?' + parents[i] + '(?:@.*)?$')
          for (var j = 0; j < archyTreeNode.nodes.length; j++) {
            if (regexp.test(archyTreeNode.nodes[j].label)) {
              archyTreeNode = archyTreeNode.nodes[j]
              found = true
              break
            }
          }
          if (!found) {
            archyTreeNode.nodes.push(newNode = { label: parents[i], nodes: [] })
            archyTreeNode = newNode
          }
        }
        if (!archyTreeNode.version) {
          archyTreeNode.version = data.packageJSON.version
          archyTreeNode.description = data.packageJSON.description
          archyTreeNode.first = first
        }
      })

      return archyTree
    }

module.exports = {
    sizes: sizes
  , parseContext: parseContext
  , buildArchyTree: buildArchyTree
}