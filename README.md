#Ender 1.0 - work in progress - developer notes

Architecture notes can be found in *lib/README.md*.

This branch won't be deployed to npm until it's ready for a 1.0 release. Use `npm link` to install your local repo as the global *ender* package.

What does *ready* mean? We haven't quite pinned that down yet, but we'll get there!

Use `npm install` to install both the dependencies and the devDependencies, otherwise you won't be able to run the executable (in *bin/ender*) or run the tests (using the Makefile).

Unit tests can be invoked by running a `make` or `make unittests`. Functional tests take longer to run as they check out packages from npm and can be invoked by running a `make functionaltests`. All types of tests can be run with `make alltests`--**this must be done before any pull-request and must all pass**.

Tests use BusterJS, you can read more about it [here](http://busterjs.org/). Buster has integrated support for Sinon for mocking and stubbing, you can read more about it [here](http://sinonjs.org/). Note that Buster is still in Beta and may occasionally break. Bug @augustl or @cjno about that.

Feel free to open an issue on GitHub if you would like to discuss something or want support of some kind. Alternatively you can bug [@rvagg](http://twitter.com/rvagg) on Twitter or via [email](mailto:rod@vagg.org).

## Some behavioural differences from 0.8.x

This branch should do everything that the current 0.8.x branch does, with some additions:

 * Some of the output to stdout will be different. Mostly minor wording changes but also the `ender info` output is included in each *build*, *add* and *remove*.
 * Packages are properly ordered (*!!*). Your *ender.js* will contain the packages you requested *in the order you requested them* on the commandline, with any dependencies placed *before* they are required.
 * *bin/ender* now gives proper exit-codes, if there is any kind of error you'll get a `1`, otherwise a `0`.
 * The `"ender"` key in *package.json* supports an array of files to concatenate to form the bridge.
 * A new `--client-lib` argument can be used to specify an alternative to the default *ender-js* package as a client lib. At the moment a client lib still needs to conform to the basics of the `$` + CommonJS pattern in order to support existing Ender packages.

------------

#ENDER [![Build Status](https://secure.travis-ci.org/ender-js/Ender.png)](http://travis-ci.org/ender-js/Ender)

**Ender is a full featured package manager for your browser.**<br/>
It allows you to search, install, manage, and compile front-end javascript packages and their dependencies for the web. We like to think of it as [NPM](https://github.com/isaacs/npm)'s little sister.

**Ender is not a JavaScript library**.<br/>
It's not a jQuery replacement. It's not even a static asset. It's a tool for making the consumption of front-end javascript packages dead simple and incredibly powerful.

![Ender](http://f.cl.ly/items/1W0P3I3D3m3U0e1j2h1c/Screen%20shot%202011-05-09%20at%2011.31.42%20AM.png)

## WHY?

In the browser - **small, loosely coupled modules are the future and large, tightly-bound monolithic libraries are the past!**

Ender capitalizes on this by offering a unique way to bring together the exciting work happening in javascript packages and allows you to mix, match, and customize your own build, suited to your individual needs, without all the extra cruft that comes with larger libraries.

With Ender, if one library goes bad or unmaintained, it can be replaced with another. Need a specific package version? No problem! Does your package have dependencies? Let us handle that for you too!

## MORE INFO

For more information checkout [http://ender.no.de](http://ender.no.de)
