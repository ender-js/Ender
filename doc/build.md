<div class="hr" id="build"></div>

BUILDING
--------
Before you do anything, you're going to need to install Ender. Ender is built with NodeJS and leverages NPM heavily for all that slick package management. What this means is that to use Ender you're going to first need to have both [NodeJS](http://nodejs.org) and [NPM](https://github.com/isaacs/npm) installed (if you haven't already).

Once you have those, simply run:

    $ npm install ender -g

This will install Ender as a CLI (command line) tool. So let's get to it...

BUILD METHODS
-------------

Ender provides a whole slew of methods for building, updating, and slimming down your libraries. Let's take a look...

<h3>Build (<code>-b, build</code>)</h3>

As the name suggests, <code>build</code> is responsible for building your libraries. It's the initial method you run when first instantiating your ender library. To use it, navigate to the directory you would like to build into and run something like:

    $ ender build scriptjs backbone

When building you can include as many packages as you like. This will generate three things of interest to you:

  - an uncompressed ender.js file,
  - a compressed ender.min.js
  - a node_modules dir (if there wasn't already one present).

With <code>build</code>, the ender.js files will include all packages inlined for his development pleasure.

*note: The node_modules folder is the directory NPM uses for installing packages and what ender uses for managing your microlibs.*

<h3>Info (<code>-i, info, list, ls</code>)</h3>

<code>info</code> will give you the current status of your built Ender library. This information includes

  - the build type
  - gzipped file size
  - a list of all the current packages (with version numbers, descriptions, and dependency tree).

To run info, change directories into your ender installation and type:

    $ ender info

<h3>Add (<code>+, add, set</code>)</h3>

It's not always possible to know which packages you may or may not want when beginning a new project and ender wants to encourage you to be as agile as possible! Build your initial library light and push in more packages whenever you run into the need. To do this, use Ender's <code>add</code> method. Run:

    $ ender add backbone

The above will append backbone to your existing ender.js and ender.min.js builds. You may also use <code>add</code> to update (or rollback) a package to a particular version:

    $ ender set bean@0.0.3

<h3>Remove (<code>-d, remove</code>)</h3>

Removing packages is sometimes even more important than pushing them on! To remove a package from your current build, simply run:

    $ ender remove backbone

<h3>Refresh (<code>., refresh</code>)</h3>

The <code>refresh</code> method will refresh your library with the latest stable builds from your activated packages. Just run:

    $ ender refresh

<h3>Help (help)</h3>

<code>help</code>, as you might expect, gives you a simple run through of the available methods.

    $ ender help

VERSIONS
--------

Ender supports package versioning through npm. To install a project at a specific version simply include the version number, prefixed by an '@':

    $ ender build qwery bean@0.0.2 underscore

To remove a versioned package no need to include the version number

    $ ender remove bean

Also, as you might expect, you can also include versions when adding packages to an already existing build:

    $ ender add underscore@0.1.0


DEPENDENCIES
------------

Ender also supports dependency management. So no need to write:

    $ ender -b backbone underscore

Instead! Just run...

    $ ender -b backbone

and underscore will be automatically built into your library! To get a full list of library dependencies, just run <code> $ ender list </code> at any time!

BUILDING YOUR OWN PACKAGES
--------------------------
Because Ender relies on NPM for package management -- extending your ender library is as simple as publishing to NPM -- let's check it out.

<h3>package.json</h3>

If you haven't already registered your project with NPM, create a file called *package.json* in your package root. A completed [package file](http://wiki.commonjs.org/wiki/Packages/1.0) should look something like this:

    {
      "name": "blamo",
      "description": "a thing that blams the o's",
      "version": "1.0.0",
      "homepage": "http://blamo-widgets.com",
      "authors": ["Mr. Blam", "Miss O"],
      "repository": {
        "type": "git",
        "url": "https://github.com/fake-account/blamo.git"
      },
      "dependencies": {
        "klass": "*"
      }
      "main": "./src/project/blamo.js",
      "ender": "./src/exports/ender.js"
    }

Have a look at the [Qwery package.json file](https://github.com/ded/qwery/blob/master/package.json) to get a better idea of this in practice.

An important thing to note in this object above is the special ender property <code>ender</code>. This property points to your *bridge* file, an integration file which Ender uses to connect your package code with the ender-js object. If you don't provide this integration file, or if you're trying to include a package which wasn't intended to work with Ender, no worries! Ender will automatically default to a [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) module integration and add the exported methods directly to ender as top level methods. Alternatively, you may specify <code> "noop" </code> for the ender integration, and this will tell ender to not try to integrate it with the ender-js lib.


<h3>The bridge</h3>

The bridge is an optional javascript integration file used to connect your code with the ender-js api. The ender-js api is detailed in the integration docs.