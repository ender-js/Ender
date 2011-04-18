<div id="intro"></div>

What is this all about?
-----------------------
Ender is an open, powerful, next level JavaScript library composed of application agnostic modules wrapped in a slick intuitive interface. At only *8k* Ender can help you build anything from small prototypes to providing a solid base for large-scale rich applications on desktop and mobile devices.

    $("p[boosh~=ness]").addClass("clutch").show();

Ender's Jeesh
-------------
Ender provides the option to build from any registered NPM packages as well as these 8 powerful core utilities (we call these [Ender's Jeesh](http://en.wikipedia.org/wiki/List_of_Battle_School_students)):

  * an expressive [Class system](https://github.com/ded/klass)
  * a fast light-weight [selector engine](https://github.com/ded/qwery)
  * a bullet-proof [DOM utility](https://github.com/ded/bonzo)
  * a multi-platform [Event provider](https://github.com/fat/bean)
  * a dynamic asynchronous [script and dependency loader](https://github.com/ded/script.js)
  * a solid [http request connection manager](https://github.com/ded/Reqwest)
  * a slick [element animator](https://github.com/ded/emile)
  * and a core set of utilities provided by [underscore](http://documentcloud.github.com/underscore)
  * plus an extension API!

What does ender look like?
--------------------------

<h3>DOM queries</h3>

    $('#boosh a[rel~="bookmark"]').each(function (el) {
      // ...
    });

<h3>Manipulation</h3>

    $('#boosh p a[rel~="bookmark"]').hide().html('hello').css({
      color: 'red',
      'text-decoration': 'none'
    }).addClass('blamo').after('✓').show();

<h3>Events</h3>

    $('#content a').listen({
      // dom based
      'focus mouseenter': function (e) {
        e.preventDefault();
        e.stopPropagation();
      },

      // dom custom
      'party time': function (e) {

      }
    });

    $('#content a').click(function (e) {

    });

    $('#content a').trigger('click party');
    $('#content a').remove('click party');

<h3>Classes</h3>

    var Person = $.klass(function (name) {
      this.name = name;
    })
      .methods({{
        walk: function () {}
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


<h3>Your Module Here</h3>

Remember, the Jeesh is here just to get you started!

    $.myMethod(function() {//does stuff});

<div class="hr" id="guide"></div>

How to get started
------------------
Ender pulls together the beauty of well-designed modular software in an effort to give you the flexibility and power to build a library which is right for your individual projects needs.

Uniquely, if one part of your library goes bad or unmaintained, it can be replaced with another with minimal to zero changes to your actual application code! Furthermore if you want to remove a feature out entirely (like for example, the animation utility or classes), you can use the Ender command utility and compose only the modules you need.

Building With Ender
-------------------
Building ender is *super easy*.

To start, if you haven't already, install [NodeJS](http://nodejs.org) and [NPM](https://github.com/isaacs/npm). Then to install just run:

    $ npm install ender

This will install Ender as a command line tool. Once Ender is installed you have four methods at your disposal: <code>build</code>, <code>just</code>, <code>async</code>, and <code>help</code>.

<h3>Build</h3>

Build is the standard method for Ender bundling. To use it, simply navigate to the directly you would like to build into and run something like:

    $ ender build scriptjs,qwery,underscore

    //or

    $ ender -b scriptjs qwery underscore

(note: you may either comma separate or space separate your ender packages... which ever you prefer.)

This should generate both an ender.js file (for dev) as well a an ender.min.js (for prod).

(note: This will also generate a node_modules folder... keeping this, will speed up building in the future if you plan on adding additional packages. However, feel free to remove it if you'd like. See <code>just</code> method for building without this folder.)

<h3>Just</h3>

The <code>just</code> method is exactly the same as build, except it will remove the *node-modules* folder after it has completed building. Use this if you don't plan on rebuilding ender multiple times or are worried about directory sizes. Using <code>just</code>, looks like:

    $ ender just scriptjs,qwery,underscore

    //or

    $ ender -j scriptjs qwery underscore


<h3>Async</h3>

The <code>async</code> method is really *freaking* awesome! Use this to build a custom ender library which loads all it's modules async using script.js!! Wow. To build all you have to do is something like:

    $ ender asyc domready qwery bean

    //or

    $ ender -a domready qwery bean

Each module is then loaded using script.js's "new school" async style of loading. You can then hook into ender's ready method, to know when you can start using ender!!

    $.ready('ender', function() {
      //all ender packages loaded async...
      $('#container').emit('click');
    });

(*note: a module must have a bridge file to be asynchronously loaded*);

If you are unfamiliar with the script.js api, you can read up more on it [here](https://github.com/ded/script.js).

(*note: There is no need to include script.js when using the async build method -- it will be included by default*)

<h3>help</h3>

<code>Help</code> gives you a simple run through of the available methods. More documentation will likely be added here down the line.


<h3>NPM</h3>

If you haven't realized already, ender is leveraging npm to lots of stuff! So, if you're new to NPM, it's a good idea to read Isaac's [Intro to NPM](http://foohack.com/2010/08/intro-to-npm/). Also, remember, ender is only as up to date as your last npm update.

<div class="hr" id="docs"></div>

Extending Ender
---------------
Extending Ender is where the true power lies! Ender leverages your existing [NPM](http://npmjs.org) *package.json* in your project root allowing you to export your extensions into Ender.

<h3>package.json</h3>

If you don't already have a package, create a file called *package.json* in your module root. This might also be a good time to register your package with NPM (This way others can use your awesome ender module (it also guarantees bragging rights))! A completed [package file](http://wiki.commonjs.org/wiki/Packages/1.0) should look something like this:

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

An important thing to note in this object is that ender relies on the properties *name*, *main*, and *ender*. Both Name and Main are already required by NPM, however the ender property is (as you might expect) unique to Ender.

**name** -- This is the file that's created when building ender.

**main** -- This points to your main source code which ultimately gets integrated into Ender. This can also be an array of files:

    "main": ["blamo-a.js", "blamo-b.js"]

**ender** -- This special key points to your bridge, which tells Ender how to integrate your package! This is where the magic happens. If you don't provide a bridge with the ender property, or if you're trying to include a package which wasn't intended to work with Ender, no worries! Ender will automatically default to a [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) module integration and automatically add the exported methods directly to ender as top level methods. More on this below.

<h3>Packaging without publishing</h3>

If you you're not ready to publish your package, but you're ready to test it's integration with ender, don't worry. Simply create the <code>package.json</code> file, as if you were going to publish it, then navigate into the root of your directory and run:

    $ npm install

This will register a local only copy of your package, which ender will use when you try to build it into your library later:

    $ ender -b qwery,bean,myPackage

The Bridge
----------
The bridge is what ender uses to connect modules to the main ender object -- it's what glues together all these otherwise independent packages into your awesome personalized library!

<h3>Top level methods</h3>

To create top level methods, like for example <code>$.myUtility(...)</code>, you can hook into Ender by calling the ender method:

    $.ender({
      myUtility: myLibFn
    });

(*note - this is the default integration if no bridge is supplied*)

<h3>The Internal chain</h3>

Another common case for Plugin developers is to be able hook into the internal collection chain. To do this, simply call the same <code>ender</code> method but pass <code>true</code> as the second argument:

    $.ender(myExtensions, true);

Within this scope the internal prototype is exposed to the developer with an existing <code>elements</code> instance property representing the node collection. Have a look at how the [Bonzo DOM utility](https://github.com/ded/bonzo/blob/master/src/ender.js) does this. Also note that the internal chain can be augmented at any time (outside of this build) during your application. For example:

    <script src="ender.js"></script>
    <script>
    // an example of creating a utility that returns a random set of elements
    $.ender({
      rand: function () {
        return this.elements[Math.floor(Math.random() * (this.elements.length + 1))];
      }
    }, true);

    $('p').rand();
    </script>

<h3>Selector Engine API</h3>

Ender also exposes a unique privileged variable called <code>$._select</code>, which allows you to set the Ender selector engine. Setting the selector engine provides ender with the $ method, like this:

    $('#foo .bar')

Setting the selector engine is done like so:

    $._select = mySelectorEngine;

You can see it in practice inside [Qwery's ender bridge](https://github.com/ded/qwery/blob/master/src/ender.js)

If you're building a Mobile Webkit or Android application, it may be a good idea to simply set it equal to QSA:

    $._select = document.querySelectorAll;


<div class="hr" id="download"></div>

Get started with the default build
-----------------
If you're looking to test drive Ender with its default modules, have a play with [the compiled source](http://ender-js.s3.amazonaws.com/ender.min.js)
<iframe id="fiddle-example" src="http://jsfiddle.net/yakWA/2/embedded/"></iframe>

<div class="hr" id="about"></div>

Why all this?
-------------
Because in the browser - small, loosely coupled modules are the future, and large, tightly-bound monolithic libraries are the past. As we like to say, *only use what you need, when you need it*.

Also, micro-utilities keep you out of having to rollback entire frameworks due to bugs found in individual parts. Instead you can simply compose the modules you want, at any version, in any combination! For example if there is a bug in klass @ version <code>1.0.6</code>, you can rollback:

    $ npm activate klass@1.0.5

In the same notion, you also get the advantage of being able to upgrade in small portions! For example if there are features you wish to use in a micro-release, you can simply update the module, then rebuild:

    $ npm update klass
    $ ender -b

License
-------
Ender (the wrapper) is licensed under MIT - *copyright 2011 Dustin Diaz & Jacob Thornton*

For the individual modules, see their respective licenses.

Contributors
------------

* Dustin Diaz
  [@ded](https://github.com/ded/ender.js/commits/master?author=ded)
  ![ded](http://a2.twimg.com/profile_images/1115320538/ded.png)
  <div class="clear"></div>
* Jacob Thornton
  [@fat](https://github.com/ded/ender.js/commits/master?author=fat)
  ![fat](http://a1.twimg.com/profile_images/1213187079/eightbit-e3950b2f-24ee-4b03-9e1f-7e13c4cd9a68.png)
  <div class="clear"></div>