0.9.12-dev (1.0-wip) / 2012-12-28
=================================

 * Heavily refactored code into multiple, separate, packages.
 * Lots of minor tweaks and fixes

0.9.6-dev (1.0-wip) / 2012-10-16
================================

  * Update Closure Compiler version in ender-minify to r2180

0.9.5-dev (1.0-wip) / 2012-10-15
================================

  * "externs" key (or "ender"->"externs", or "overlay"->"ender"->"externs") for each package in a build can supply an array of files that are passed to Closure as --externs arguments, on top of any Ender --externs arguments

0.9.4-dev (1.0-wip) / 2012-06-20
================================

  * Additional support for overriding package.json keys with "ender" (and "overlay"->"ender" key)
  * Node 0.7/0.8 support
  * Use new `logstream` property in npm (@1.1.30) rather than the (removed) `logfd`
  * extract ender-minify project
  * --minifier argument to switch between Closure and UglifyJS (default)

0.9.3-dev (1.0-wip) / 2012-06-01 
================================

  * Adjust package.json data after reading to allow for some keys in an "ender" object (if it exists) to override root keys, including "name", "main", "ender" (bridge), "dependencies". Also accept overriding with "overlay"->"ender" as per the CommonJS Packages spec.
  * Take more responsibility for deciding which packages to install via npm. If packages are already in node_modules they are not installed with npm *unless* the package is specified as a path. Also allows Ender to install dependencies specified in "ender"->"dependencies".
  * --force-install option to force npm install of root packages, always true for for `refresh`
  * --quiet option to suppress stdout (except for errors)
  * upgrade dependencies
  * fix dupe dir scanning for dependency tree construction
  * add Contributors file
  * add Changelog.md file
  * --level (-l) of whitespace|simple|advanced to pass to Closure compiler

0.9.x-dev (1.0-wip)
===================

 * Nearly complete rewrite of 0.8.x branch, mainly to solve dependency tree related problems, feature-compatible with 0.8.x
 * Dependencies are properly ordered (dependencies come before their dependents) and always come out in the same order on each build
 * Stdout is now exclusively performed via the modules in the lib/output/ directory
 * `ender info` is now run after a build/add/remove/set/refresh
 * "ender" key in package.json can now take an array of files to concatenate to build a bridge file, just like the "main" key
 * The --client-lib command line argument can be used to override the default root/client library 'ender-js'
 * Much better error handling and reporting, including a --debug option for extra detail
 * bin/ender gives proper exit codes in all cases, 0 for success and 1 for any kind of error--good for including in a build chain (such as a Makefile)
 * Tons of tests, unit tests and functional tests; uses BusterJS
 * Template-based build process, uses Hogan to compile ender.js from sources
 * ... lots of other stuff ...