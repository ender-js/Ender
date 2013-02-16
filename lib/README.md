# Architecture notes

The main entry point of the application is `exec()` in *main.js*. This is used by *../bin/ender* and accepts a standard argv array. It can also take a build string which it will split and parse (see the *version* functional test for an example of this).

*args-parse.js* is used to parse the commandline and will determine which 'main' command to run. Each available 'main' command has a *main-X.js* file and an *output/main-X-output.js* file which are loaded by *main.js* and executed.

Each main main-X module has an `exec()` method that is called by *main.js* with the parsed commandline arguments, an 'output' object and a callback. The 'output' object is constructed by the corresponding output/main-X-output module and is responsible for all stdout for that command. Nothing is printed to stdout except by the objects available in the *output/* directory. This separation should allow for alternative front-ends to be applied to Ender and other creative uses of Ender via the API.

All interaction with npm occurs through *repository.js*, knowledge of npm is completely partitioned from the rest of the application. *install.js* handles all the special logic to decide which packages need to be installed via npm.

Utilities for dealing with Node packages are kept in *package-util.js* (i.e. anything to do with 'node_modules' or 'package.json').

Ender builds are compiled in the *SourceBuild* object which contains a single *SourcePackage* object for each package in the build. *SourcePackage* understands how to assemble the JavaScript source for that package (the 'main' and 'ender' files). *SourceBuild* knows how to put the packages together for a plain and minified build.

The most complicated parts of the application can be found in *main-build-util.js* where the dependency tree is built from package.json files and node_modules directories and forEach* utilities are used to traverse the tree and spit out the required packages.

## Some general rules

 * No stdout except via *output* modules.
 * No global or module-globals for keeping state. Everything is either passed from function-to-function or is kept in an object that is instantiated by `Object.create()`. The *output* modules are instantiated as are the *SourceBuild* and *SourcePackage* objects. There are a couple of minor exceptions to this rule for caching results (in *template.js* for instance).
 * Complicated utility functions for the main executable modules are stored in their corresponding *-util.js* module and are exposed via `module.exports`. This way the executable modules can be kept relatively clean and the uility functions can be easily unit-tested.
 * Unit tests for as much as possible, functional tests for broad, verifiable executable processes.