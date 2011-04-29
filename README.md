<div id="intro"></div>

WELCOME TO YOU'RE "DOOM!"
-------------------------
Ender is not a JavaScript library in the traditional sense. So don't rush out and try to replace jQuery or MooTools with Ender... It just wouldn't work.... But! **you can** build a library from Ender which will. And you should. right now.

That's because: *Ender is an open, powerful, micro-to-macro API for composing your own custom JavaScript library; it wraps up application agnostic, independent modules into a slick, intuitive, and familiar interface so you don't have to.*

OK, SURE... BUT WHY?
--------------------
Because in the browser - small, loosely coupled modules are the future, and large, tightly-bound monolithic libraries are the past!

Ponder this... Ender is unique and important in two key ways:

1) Ender provides front end developers with a true package management system and the powerful command line tools necessary to back it up... making your library maintenance tasks simple, painless, and fast.

2) Ender offers a way to bring together the awesome work happening in small frameworks and libraries that otherwise do only one thing, and allows you to mix, match, and customize your own library suited to your individual needs without all the extra cruft that comes with larger libraries.

With Ender, if one part of your library goes bad or unmaintained, it can be replaced with another. Need a specific package version? no big deal. Want to load all your packages asynchronously to cut down on page load? Ender can do that for you too.


<div class="hr" id="build"></div>

BUILDING
--------
Before you do anything, you're going to need to install Ender. Ender is built with NodeJS and leverages NPM heavily for all that slick package management. What this means is that to use Ender you're going to first need to have both [NodeJS](http://nodejs.org) and [NPM](https://github.com/isaacs/npm) installed (if you haven't already).

Once you have those, simply run:

    $ npm install ender

or if you're a boss (you know you are) and you're using the latest npm 1.0 rc:

    $ npm install ender -g

This will install Ender as a CLI (command line) tool. So let's get to it...

BUILD METHODS
-------------

Ender provides a whole slew of methods for building, updating, and slimming down your libraries. Let's take a look...

<h3>Build (<code>-b, build</code>)</h3>

As the name suggests, <code>build</code> is responsible for building your libraries. To use it, navigate to the directory you would like to build into and run something like:

    $ ender build scriptjs qwery underscore

When building you can include as many packages as you like. This will generate three things of interest to you:

  - an uncompressed ender.js file,
  - a compressed ender.min.js
  - a node_modules dir (if there wasn't already one present).

With <code>build</code>, the ender.js files will include all packages inlined for his development pleasure.

*note: The node_modules folder is the directory NPM uses for installing packages. Keeping this makes building your ender files faster, but is otherwise optional. If you'd prefer to have this directory cleaned up after your build checkout the <code>just</code> method below.*

<h3>Just (<code>-j, just</code>)</h3>

The <code>just</code> method is exactly the same as build, except it will remove the *node_modules* folder after it has completed building. Use this if you don't plan on rebuilding ender very often or are worried about directory sizes on your machine. Using <code>just</code>, looks like:

    $ ender just scriptjs qwery underscore

This will generate

  - an uncompressed ender.js file
  - a compressed ender.min.js file.

*note: <code>just</code> will completely remove the node_modules folder itself... think <code>rm -rf</code>... so use at your own risk*

<h3>Async (<code>-a, async</code>)</h3>

The <code>async</code> method generates a library which asynchronously loads its packages using script.js. This is *clutch* when trying to cut down on initial page loads. To build an async library, run something like:

    $ ender async domready qwery underscore

Each package is then loaded using [script.js](https://github.com/ded/script.js)'s "new school" style of loading and given a special 'ender' event which you can later hook into by using Ender's <code>ready</code> method -- check it out below:

    $.ready('ender', function() {
      //all ender packages have loaded async...
      $('#container').emit('click'); //boosh
    });

*note: a module must have a bridge file to be asynchronously loaded*

If you weren't already, it may be a good idea to get familiar with the [script.js API](https://github.com/ded/script.js).

*note: There is no need to include script.js when using the async build method -- it will be included by default*

<h3>Info (<code>-i, info, list</code>)</h3>

<code>info</code> will give you the current status of your built Ender library. This information includes

  - the build type
  - gzipped file size
  - a list of all the current packages (with version numbers and descriptions).

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
      "main": "./src/project/blamo.js",
      "ender": "./src/exports/ender.js"
    }

Have a look at the [Qwery package.json file](https://github.com/ded/qwery/blob/master/package.json) to get a better idea of this in practice.

An important thing to note in this object above is the special ender property <code>ender</code>. This property points to your *bridge* file, an integration file which Ender uses to connect your package code with the ender-js object. If you don't provide this integration file, or if you're trying to include a package which wasn't intended to work with Ender, no worries! Ender will automatically default to a [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) module integration and add the exported methods directly to ender as top level methods. More on this below.

<h3>The bridge</h3>

The bridge is an optional javascript integration file used to connect your code with the ender-js api. The ender-js api is detailed below.

*note: The bridge is required for asynchronously loading your package with the <code>async</code> build method.*


<div class="hr" id="integrate"></div>

INTEGRATING
-----------
The front end API provided by [ender-js](http://github.com/ender-js/ender-js) is what glues together and ultimately offers cohesion and a sense of familiarity to the different packages built into your library by Ender. It's simple, elegant, and super flexible. Let's take a look how you can leverage it, if you're interested in packaging your own stuff!

<h3>Top level methods</h3>

To create top level methods on the ender-js object ($) you can hook into it by calling the <code>ender</code> method:

    $.ender({
      myUtility: myLibFn
    });

The above code would provide <code>$.myUtility()</code>

<h3>The Internal chain</h3>

Another common desire for developers is to be able hook into the internal collection chain. To do this, simply call the same <code>ender</code> method above, but pass <code>true</code> as the second argument:

    $.ender(myExtensions, true);

Within the scope of your extension methods, the internal prototype will be exposed to the developer with an existing <code>elements</code> instance property representing the node collection. This looks something like this in practice:

    $.ender({
      rand: function () {
        return this.elements[Math.floor(Math.random() * this.elements.length)];
      }
    }, true);

    $('p').rand();

You might consider having a look at how the [Bonzo DOM utility](https://github.com/ded/bonzo/blob/master/src/ender.js) utilizes this feature.

<h3>Selector Engine API</h3>

Ender-js also exposes a unique privileged variable called <code>$._select</code>, which allows you to set the ender-js selector engine. Setting the selector engine provides ender-js with the $ method, like this:

    $('#foo .bar')

Setting the selector engine is done like so:

    $._select = mySelectorEngine;

You can see it in practice in [Qwery](https://github.com/ded/qwery/blob/master/src/ender.js)

This is great news if you're building a Mobile Webkit or Android application, simply set it to <code>querySelectorAll</code>:

    $._select = function (selector, root) {
      return (root || document).querySelectorAll(selector);
    });

<div class="hr" id="jeesh"></div>

THE JEESH
---------

The Jeesh is like a starter pack for ender. At only *10k* the Jeesh can help you build anything from small prototypes to providing a solid base for large-scale rich application for desktop and mobile devices. At it's core, it's a collection of packages that we've found particularly useful for major use-case development endeavors -- but we encourage use to <code>add</code> and <code>remove</code> packages to really make it your own. Currently, the Jeesh includes:

  * ScriptJS - a dynamic asynchronous [script and dependency loader](https://github.com/ded/script.js)
  * Qwery - a fast light-weight [selector engine](https://github.com/ded/qwery)
  * Bonzo - a bullet-proof [DOM utility](https://github.com/ded/bonzo)
  * Bean - a multi-platform [Event provider](https://github.com/fat/bean)
  * domReady - a cross-browser [domReady](github.com/ded/domready)
  * Émile - a slick [element animator](https://github.com/ded/emile)
  * Underscore - a core set of [utilities](http://documentcloud.github.com/underscore)
  * Reqwest - a solid [http request connection manager](https://github.com/ded/Reqwest)
  * Klass - an expressive [Class system](https://github.com/ded/klass)


WHAT DOES THIS SETUP LOOK LIKE?
-------------------------------

<h3>DOM queries</h3>

    $('#boosh a[rel~="bookmark"]').each(function (el) { ... });

<h3>Manipulation</h3>

    $('#boosh p a[rel~="bookmark"]').hide().html('hello').css({
      color: 'red',
      'text-decoration': 'none'
    }).addClass('blamo').after('✓').show();

<h3>Events</h3>

    $('#content a').bind('keydown input', handler);
    $('#content a').emit('customEvent');
    $('#content a').remove('click.myClick');

<h3>Classes</h3>

    var Person = $.klass({
      walk: function () { ... }
    });
    var SuperHuman = Person.extend({
      walk: function () {
        this.supr();
        this.fly();
      },
      fly: function () {}
    });
    (new SuperHuman('bob')).walk();

<h3>AJAX</h3>

    $.ajax('path/to/html', function (resp) {
      $('#content').html(resp);
    });
    $.ajax({
      url: 'path/to/json',
      type: 'json',
      method: 'post',
      success: function (resp) {
        $('#content').html(resp.content);
      },
      failure: function () {}
    });

<h3>script loading</h3>

    $.script(['mod1.js', 'mod2.js'], 'base', function () {
      // script is ready
    });

    // event driven. listen for 'base' files to load
    $.script.ready('base', function () {

    });

<h3>Animation</h3>

    // uses native CSS-transitions when available
    $('p').animate({
      opacity: 1,
      width: 300,
      color: '#ff0000',
      duration: 300,
      after: function () {
        console.log('done!');
      }
    });

<h3>Utility</h3>

Utility methods provided by [underscore](http://documentcloud.github.com/underscore) are augmented onto the '$' object. Some basics are illustrated:

    $.map(['a', 'b', 'c'], function (letter) {
      return letter.toUpperCase();
    }); // => ['A', 'B', 'C']

    $.uniq(['a', 'b', 'b', 'c', 'a']); // => ['a', 'b', 'c']

    $[65 other methods]()

<h3>No Conflict</h3>

    var ender = $.noConflict(); // return '$' back to its original owner
    ender('#boosh a.foo').each(fn);


GETTING STARTED WITH THE JEESH
------------------------------
If you're looking to test drive this setup, have a play with [the compiled source](http://ender-js.s3.amazonaws.com/ender.min.js)
<iframe id="fiddle-example" src="http://jsfiddle.net/yakWA/2/embedded/"></iframe>


<div class="hr" id="about"></div>

ABOUT THIS PROJECT
------------------
We would love to hear how you're using ender or why you're not. What you love... what you hate... And we would love all the help we can get! Got a great idea? Open an issue, submit a pull request, or [message us on twitter](http://twitter.com/intent/tweet?text=@fat%20@ded%20-%20I'm%20using%20ender.%20Check%20it%20out%20at%20http://)!

LICENSE
-------
Ender is licensed under MIT - *copyright 2011 Dustin Diaz & Jacob Thornton*

For the individual modules, see their respective licenses.

CONTRIBUTORS
------------

* Dustin Diaz
  [@ded](https://github.com/ender-js/Ender/commits/master?author=ded)
  ![ded](http://a2.twimg.com/profile_images/1115320538/ded.png)
  <div class="clear"></div>
* Jacob Thornton
  [@fat](https://github.com/ender-js/Ender/commits/master?author=fat)
  ![fat](http://a1.twimg.com/profile_images/1213187079/eightbit-e3950b2f-24ee-4b03-9e1f-7e13c4cd9a68.png)

<div class="clear"></div>

P.S.
---
that's correct, [you're doom!](http://blog.urbanbohemian.com/2009/04/08/5201/)
