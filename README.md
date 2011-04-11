Ender.js
--------
an open, powerful, next level JavaScript library composed of application agnostic submodules wrapped in a slick intuitive interface. At only 8k Ender can help you build anything from small prototypes to providing a solid base for large-scale rich applications on desktop and mobile devices.

Ender's Jeesh
-------------
By default, Ender's main Platoon for production battle ([Ender's Jeesh](http://en.wikipedia.org/wiki/List_of_Battle_School_students)) consists of these 8 powerful core utilities:

  * an expressive [Class system](https://github.com/ded/klass)
  * a fast light-weight [selector engine](https://github.com/ded/qwery)
  * a bullet-proof [DOM utility](https://github.com/ded/bonzo)
  * a multi-platform [Event provider](https://github.com/fat/bean)
  * a dynamic asynchronous [script and dependency loader](https://github.com/ded/script.js)
  * a solid [http request connection manager](https://github.com/ded/Reqwest)
  * a slick [element animator](https://github.com/ded/emile)
  * and a core set of utilities provided by [underscore](http://documentcloud.github.com/underscore)
  * plus an extension API!

Examples
--------

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

The haps
--------
Ender.js pulls together the beauty of well-designed modular software and proves that git submodules can actually work. Thus if one part of the system goes bad or unmaintained, it can be replaced with another with minimal to zero changes to the wrapper (Ender). Furthermore if you want remove a feature out entirely (like for example, the animation utility), you can use the Ender command utility and compose only the submodules you need.

Building
--------
For those interested in having a play with Ender core. Here's the process. Assuming you have git already — *install [NodeJS](http://nodejs.org)* — then run the following commands in your workspace:

    git clone https://github.com/ded/Ender.js.git
    cd Ender.js
    git submodule update --init
    make

Take special note that building with Ender will more than likely require frequently updating your submodules. Thus if you're unsure how this works, it's best to [read up on how submodules work](http://www.kernel.org/pub/software/scm/git/docs/git-submodule.html). However the simple answer is to get used to doing this:

    git pull
    git submodule update

Extending Ender
---------------
Extending Ender is where the true power lies! Ender uses your existing [NPM](http://npmjs.org) *package.json* in your project root allowing you to export your extensions into Ender. There are three interfaces allowing you to hook into each piece appropriately.

<h3>package.json</h3>

If you don't already have a package, create a file called *package.json* in your module root. It should look something like this:

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

Some important keys to note in this object that are required are *name*, *main*, and *ender*

<h4>name</h4>
This is the file that's created when building ender.

<h4>main</h4>

This points to your main source code which ultimately gets integrated into Ender. This of course, can also be an array of files

    "main": ["blamo-a.js", "blamo-b.js"]

<h4>ender</h4>
This special key points to your bridge which tells Ender how to integrate your package! This is where the magic happens.

The Bridge
----------

<h3>Top level methods</h3>

To create top level methods, like for example <code>$.myUtility(...)</code>, you can hook into Ender by calling the ender method:

    $.ender({
      myUtility: myLibFn
    });

To see this in practice, see how [underscore.js extends Ender](https://github.com/ded/underscore/blob/master/ender.js).

<h3>The Internal chain</h3>

Another common case for Plugin developers is to be able hook into the internal collection chain. To do this, simply call the same <code>ender</code> method but pass <code>true</code> as the second argument:

    $.ender(myExtensions, true);

Within this scope the internal prototype is exposed to the developer with an existing <code>elements</code> instance property representing the node collection. Have a look at how the [Bonzo DOM utility](https://github.com/ded/bonzo/blob/master/src/ender.js) does this. Also note that the internal chain can be augmented at any time (outside of this build) during your application. For example:

    <script src="ender.js"></script>
    <script>
    $.ender({
      rand: function () {
        return this.elements[Math.floor(Math.random() * (this.elements.length + 1))];
      }
    }, true);

    $('p').rand();
    </script>

<h3>Query API</h3>

By default Ender has a core set of default packages. One, namely [Qwery](https://github.com/ded/qwery/) as the CSS query engine, hooks into the Ender selector interface by setting the privileged <code>_select</code> method. That looks like this:

    $._select = mySelectorEngine;

You can see it in practice inside [Qwery's ender bridge](https://github.com/ded/qwery/blob/master/src/ender.js)

If you're building a Mobile Webkit or Android application, it may be a good idea to simply remove the selector engine and replace it with this:

    $._select = function (selector) {
      return document.querySelectorAll(selector);
    };

Why all this?
-------------
Because in the browser - small, loosely coupled modules are the future, and large, tightly-bound monolithic libraries are the past.

Building a custom platoon
------------
Currently in the works is a command-line interface to building published NPM modules into the Ender.js wrapper. It's next-level future boss. We promise. Check out the [preview video](http://www.vimeo.com/22211892) of this in action. However the short explanation is that you can do this:

    $ ender -b qwery,bonzo,bean,underscore

This creates a customized Ender platoon suited to your liking :) It's currently in alpha stages, so please be gentle.

License
-------
Ender.js (the wrapper) is licensed under MIT - copyright 2011 Dustin Diaz & Jacob Thornton

For the individual submodules, see their respective licenses.

Contributors
------------

* [Dustin Diaz](https://github.com/ded/ender.js/commits/master?author=ded)
* [Jacob Thornton](https://github.com/ded/ender.js/commits/master?author=fat)
