
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

Within the scope of your extension methods, the internal prototype will be exposed to the developer using the <code>this</code> context representing the node collection. This looks something like this in practice:

    $.ender({
      rand: function () {
        return this[Math.floor(Math.random() * this.length)];
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

<h3>CommonJS like Module system</h3>

Ender also exposes a module API which is based on CommonJS Modules spec v1.1.1. There are two methods it exposes to do this.

The first method is require. Require takes a string which corresponds to a package name and returns a package object. For example:

    var _ = require('underscore'); //return the underscore object

To register a package use the provide method. The provide method looks like this:

    provide("myPackage", myPackageObj);

These methods are particularly useful when working with microlibs which are already CommonJS compliant (like underscore, backbone, etc.).

When building with Ender, all packages with CommonJS exports will automatically be made available via the require method. It's important to note here that because of this, these modules will not be accessible directly in the global scope -- this of course is great news!

So, if you were to run the following build command <code>ender build backbone</code>, you could then access both backbone and underscore from your lib like this:

    var backbone = require('backbone')
      , _ = require('underscore');

    backbone.Models(...)
    _.each(...)

Ender's module support is also great when you run into libs who are competing for method names on the $ namespace. For example, if microlib "foo" and microlib "bar" both expose a method <code>baz</code> -- you could use require to gain access to the method being overridden -- as well as set which method you would prefer to be on ender's internal chain... for example:

    $.baz() //executes bar's method baz

    $.ender({baz: require('foo').baz}); // sets $.baz to be foo's method baz
    $.ender({baz: require('bar').baz}); // changes $.baz back to bar's method baz

    require('foo').baz() //foo's baz is still accessible at any time.